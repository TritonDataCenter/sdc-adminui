/** @jsx React.DOM **/

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2018, Joyent, Inc.
 */

'use strict';

var Backbone = require('backbone');
var $ = require('jquery');
var _ = require('underscore');
var React = require('react');

var MultiNicConfigComponent = React.createFactory(require('../components/multi-nic-config'));
var ServerTypeahead = React.createFactory(require('../components/server-typeahead'));
var Package = require('../models/package');
var Packages = require('../models/packages');
var SSHKeys = require('../models/sshkeys');
var User = require('../models/user');
var Vm = require('../models/vm');
var Job = require('../models/job');

var TypeaheadImageView = require('./typeahead-image');

var JobProgressView = require('./job-progress');
var PackagePreview = require('./package-preview');
var UserPreview = require('./user-preview');

var adminui = require('../adminui');
var JSONEditor = require('./traits-editor');


var PackageSelectOption = Backbone.Marionette.ItemView.extend({
    attributes: function () {
        return {
            name: this.model.get('name'),
            value: this.model.get('uuid')
        };
    },
    tagName: 'option',
    template: function (data) {
        return data.name + ' ' + data.version;
    }
});

var PackageSelect = Backbone.Marionette.CollectionView.extend({
    itemView: PackageSelectOption,
    tagName: 'select',
    collectionEvents: {
        'sync': 'onSync'
    },
    events: {
        'change': 'onChange'
    },
    onSync: function (e) {
        this.$el.trigger('chosen:updated');
    },
    onRender: function () {
        this.$el.prepend('<option></option>');
        this.$el.chosen({
            disable_search_threshold: 5,
            width: '280px'
        });
    },
    onChange: function (e) {
        var uuid = $(e.target).val();
        this.trigger('select', this.collection.get(uuid));
    }
});

var ProvisionVmTemplate = require('../tpl/provision-vm.hbs');

var TypeaheadUser = require('./typeahead-user');

var View = Backbone.Marionette.Layout.extend({
    url: 'provision',
    sidebar: 'vms',
    template: ProvisionVmTemplate,
    regions: {
        'userPreview': '.user-preview-region'
    },
    events: {
        'submit form': 'provision',
        'click .back': 'backToVirtualMachines',
        'blur input[type=text]': 'checkFields',
        'blur input#input-owner': 'onBlurOwnerField',
        'click .configure-metadata': 'showConfigureMetadata'
    },
    modelEvents: {
        'error': 'onError'
    },
    ui: {
        'form': 'form',
        'alert': '.validation-errors',
        'ownerInput': '#input-owner',
        'brandControls': '.form-group-brand'
    },

    initialize: function (options) {
        this.vent = adminui.vent;
        this.model = new Vm();
        this.packages = new Packages();
        this.packageSelect = new PackageSelect({
            collection: this.packages
        });

        this.nicSelects = [];

        this.customer_metadata = {};
        this.settings = require('../models/settings');
        this.selectedPackage = new Package();
        this.packagePreview = new PackagePreview({model: this.selectedPackage});

        this.packages.on('reset', function (collection) {
            this.selectedPackage.set(collection.models[0].attributes);
        }, this);

        this.packageSelect.on('select', function (pkg) {
            this.selectedPackage.set(pkg.attributes);
            this.resetImage();
            this.ui.brandControls.hide();
        }, this);

        this.packages.fetchActive();
    },

    backToVirtualMachines: function () {
        adminui.vent.trigger('showcomponent', 'vms');
    },

    onBlurOwnerField: function (e) {
        var $field = this.ui.ownerInput;
        var self = this;

        if ($field.val().length === 36) {
            var u = new User({uuid: $field.val()});
            u.fetch().done(function () {
                this.onSelectUser(u);
            }.bind(this));
        } else {
            process.nextTick(function () {
                self.$('.form-group-networks').hide();
                self.userPreview.close();
                self.removeAllNics();
            });
        }
    },

    showConfigureMetadata: function (e) {
        e.preventDefault();
        var view = new JSONEditor({
            title: "Metadata",
            description: "Metadata to include in the provisioned Virtual Machine, stored into customer_metadata property.",
            data: this.customer_metadata
        });
        view.on('save', function (data) {
            if (Object.keys(data).length) {
                this.$('.configure-metadata').addClass("btn-success");
            } else {
                this.$('.configure-metadata').removeClass("btn-success");
            }
            console.log("Configured metadata", data);
            this.customer_metadata = data;
            view.close();
        }.bind(this));
        view.show();
    },

    removeNic: function (nic) {
        if (this.nicSelects.length === 1) {
            window.alert('Cannot Remove last Network Interface');
            return;
        }
        var self = this;
        React.unmountComponentAtNode(nic.getDOMNode());
        $(nic.getDOMNode()).closest('.nic-config-container').fadeOut(function () {
            this.remove();
            self.nicSelects = _.without(self.nicSelects, nic);
        });
    },
    removeAllNics: function () {
        _.each(this.nicSelects, function (nic) {
            React.unmountComponentAtNode(nic.getDOMNode());
            $(nic.getDOMNode()).closest('.nic-config-container').remove();
        }, this);
        this.nicSelects = [];
    },

    onSelectUser: function (user) {
        if (!user) {
            this.userPreview.close();
            this.removeAllNics();
            this.checkFields();
            return null;
        }
        if (this.selectedUser && this.selectedUser.id === user.id) {
            return this.userPreview.show(new UserPreview({model: user}));
        }
        
        this.selectedUser = user;
        this.userPreview.show(new UserPreview({model: user}));
        this.removeAllNics();

        var settings = this.settings;

        var self = this;

        $.when(
            this.settings.fetch()
        ).then(function () {
            var networkPresets = settings.get('provision.preset_networks') || [];

            while (networkPresets.length < 1) {
                networkPresets.push({primary: true});
            }
            self.renderMultiNicSelect(networkPresets);
            self.checkFields();
        }, function failure() {
            console.error('failed to retrieve settings');
            var networkPresets = [];
            networkPresets.push({primary: true});
            self.renderMultiNicSelect(networkPresets);
            self.checkFields();
        });


        this.sshKeys = new SSHKeys(null, {user: user});
        this.listenTo(this.sshKeys, 'sync', this.onFetchKeys);
        this.sshKeys.fetch();

        return null;
    },

    onFetchKeys: function (collection) {
        if (this.sshKeys.length === 0) {
            this.$('.no-sshkeys-warning').show();
        } else {
            this.$('.no-sshkeys-warning').hide();
        }
        this.userKeys = this.sshKeys.map(function (k) {
            return k.get('openssh');
        });
    },

    showNoSshkeysWarning: function () {
        this.$('.no-sshkeys-warning').show();
    },

    onNicConfigChange: function () {
        this.checkFields();
    },

    renderMultiNicSelect: function (nics) {
        nics = nics.map(function (nic) {
            if (typeof(nic) === 'string') {
                nic = {network_uuid: nic};
            }
            return nic;
        });
        var props = {
            expandAntispoofOptions: false,
            networkFilters: {provisionable_by: this.selectedUser.get('uuid')},
            nics: nics,
            isIpAvailable: true,
            onChange: this.onNicConfigChange.bind(this)
        };
        if (this.multiNicConfigComponent) {
            React.unmountComponentAtNode(this.$('.network-selection').get(0));
        }
        this.multiNicConfigComponent = React.render(new MultiNicConfigComponent(props),
            this.$('.network-selection').get(0));
        this.$('.form-group-networks').show();
        this.$('.form-group-primary-network').show();
    },

    onRender: function () {
        adminui.vent.trigger('settitle', 'provision');
        this.ui.brandControls.hide();

        this.userInput = new TypeaheadUser({
            accountsOnly: true,
            el: this.$('[name=owner]')
        });
        this.listenTo(this.userInput, 'selected', this.onSelectUser, this);
        this.userInput.render();         

        this.imageInput = new TypeaheadImageView({el: this.$('input[name=image]')});
        this.listenTo(this.imageInput, 'selected', this.onSelectImage, this);
        this.imageInput.render();

        this.serverInput = React.render(
            ServerTypeahead({
                className: 'form-control'
            }), this.$('#input-server').get(0)
        );

        this.packageSelect.setElement(this.$('select[name=package]')).render();
        this.$('.form-group-networks').hide();
        this.$('.package-preview-container').append(this.packagePreview.render().el);

        this.hideError();
        this.$('.no-sshkeys-warning').hide();
        this.checkFields();

        return this;
    },

    onShow: function () {
        this.$('input:not([disabled]):first').focus();
    },

    onSelectImage: function (image) {
        if (!image) {
            var imgValue = this.imageInput.$el.val();
            if (!imgValue || imgValue && imgValue.length !== 36) {
                this.ui.brandControls.hide();
                this.checkFields();
            }
            return;
        }

/*
 *      Both image and package have an optional brand attribute.
 *      If brand is set in the image, it'll always take precedence.
 *      If it isn't, use the package brand after checking that it's
 *      consistent with the image type. If neither the image nor the
 *      package has a brand defined, default to the more common brand.
 */
        var formData = this.ui.form.serializeObject();
        var pkg = this.packages.get(formData['package']);
        if (pkg) {
            var pkgBrand = pkg.get('brand');
        }

        if (image &&
            image.requirements &&
            image.requirements.brand &&
            typeof(image.requirements.brand) === 'string') {
            this.setBrand(image.requirements.brand);
            this.ui.brandControls.prop('disabled', 'disabled');
        } else {
            if (image.get('type') === 'zvol') {
                if (pkgBrand && pkgBrand === 'bhyve') {
                    this.setBrand(pkgBrand);
                } else {
                    this.setBrand('kvm');
                }
                this.disableBrands('joyent', 'joyent-minimal', 'lx', 'sngl');
            } else if (image.get('type') === 'lx-dataset') {
                this.setBrand('lx');
                this.disableBrands('joyent', 'joyent-minimal', 'kvm', 'bhyve', 'sngl');
            } else if (image.get('type') === 'zone-dataset') {
                if (pkgBrand && pkgBrand === 'joyent-minimal') {
                    this.setBrand(pkgBrand);
                } else {
                    this.setBrand('joyent');
                }
                this.disableBrands('kvm', 'bhyve', 'lx', 'sngl');
            } else {
                this.disableBrands(false);
            }
        }
        this.ui.brandControls.show();
        this.checkFields();
    },

    disableBrands: function () {
        var brands = [];
        if (arguments[0] !== false) {
            brands = arguments;
        }
        this.$('.form-group-brand option').removeAttr('disabled');
        _.each(brands, function (b) {
            this.$('.form-group-brand option[value=' + b + ']').attr('disabled', true);
        }, this);
    },

    setBrand: function (brand) {
        this.$('.form-group-brand').find('[name=brand]').val(brand);
    },

    resetImage: function () {
        this.$('#input-image').val('');
    },

    checkFields: function () {
        this.hideError();

        var values = this.extractFormValues();
        var valid;

        if (!values.owner_uuid ||
            !values.owner_uuid.length ||
            !values.networks ||
            !values.networks.length) {
            valid = false;
        } else {
            valid = true;
        }

        if (!values.billing_id) {
            valid = false;
        }

        if (values.pkgBrand && values.pkgBrand != values.brand) {
            valid = false;
            console.log("package brand mismatch: ", values.pkgBrand);
        }

        // if (values.alias && values.alias.length != 0) {
        //     delete values.alias;
        // }

        if (!values.image_uuid && (!values.disks || !values.disks[0] || !values.disks[0].image_uuid)) {
            valid = valid && false;
        } else {
            valid = valid && true;
        }

        var primaryNetwork = _.findWhere(values.networks, {primary: true});

        if (!primaryNetwork) {
            valid = false;
        }

        _.map(values.networks, function (n) {
            if (typeof n.ipv4_uuid !== 'string' || n.ipv4_uuid.length === 0) {
                valid = false;
            }
        });

        if (valid) {
            this.enableProvisionButton();
        } else {
            this.disableProvisionButton();
        }
    },

    disableProvisionButton: function () {
        this.$('button[type=submit]').attr('disabled', 'disabled');
    },

    enableProvisionButton: function () {
        this.$('button[type=submit]').removeAttr('disabled');
    },

    extractFormValues: function () {
        var formData = this.ui.form.serializeObject();
        var values = {
            image_uuid: formData.image,
            owner_uuid: formData.owner,
            brand: formData.brand
        };
        if (formData.delegate_dataset) {
            values.delegate_dataset = true;
        }


        if (formData.alias && formData.alias.length) {
            values.alias = formData.alias;
        }

        if (formData.server) {
            values['server_uuid'] = formData.server;
        }

        var pkg = this.packages.get(formData['package']);

        if (pkg) {
            values['billing_id'] = pkg.get('uuid');
            values['pkgBrand'] = pkg.get('brand') || '';

            // quota value needs to be in GiB
            var quotaMib = pkg.get('quota');
            if (quotaMib) {
                quotaMib = Number(quotaMib);
                values['quota'] = Math.ceil(Number(quotaMib) / 1024);
            }


            if (values['brand'] === 'kvm' || values['brand'] === 'bhyve') {
                // disk size passed in as MiB.
                values['disks'] = [
                    {'image_uuid': values['image_uuid']},
                    {'size': quotaMib}
                ];

                // KVM does not need top level image_uuid and quota passed in
                delete values['image_uuid'];
                delete values['quota'];
            }

        }

        if ((values['brand'] === 'kvm' || values['brand'] === 'bhyve' || values['brand'] === 'lx') && this.userKeys) {
            values.customer_metadata = {
                root_authorized_keys: this.userKeys.map(function (k) {
                    return  _.str.trim(k).replace(/(\r\n|\n|\r)/gm, '');
                }).join('\n')
            };
        }

        values.customer_metadata = values.customer_metadata || {};
        values.customer_metadata = _.extend(values.customer_metadata, this.customer_metadata);

        if (this.multiNicConfigComponent) {
            values.networks = _.map(this.multiNicConfigComponent.getValue(), function (nic) {
                var net = _.clone(nic);
                if (net.ip) {
                    net.ipv4_ips = [net.ip];
                    delete net.ip;
                }
                net.ipv4_uuid = net.network_uuid;
                delete net.network_uuid;

                return net;
            });
        }

        return values;
    },

    hideError: function () {
        this.ui.alert.hide();
    },

    onError: function (model, xhr, options) {
        var fieldMap = {
            'image_uuid': '[name=image]',
            'alias': '[name=alias]',
            'owner_uuid': '[name=owner]',
            'server_uuid': '[name=server]'
        };
        var err = xhr.responseData;
        this.ui.alert.find('ul').remove();
        this.ui.alert.find('.message').html(err.message);
        this.ui.alert.append('<ul />');
        var ul = this.ui.alert.find('ul');
        _.each(err.errors, function (errObj) {
            var li = $('<li></li>');
            li.text(_.str.sprintf('[%s] %s', errObj.field, errObj.message));
            ul.append(li);
        }, this);
        this.$('.form-group').removeClass('has-error');
        _.each(err.errors, function (errObj) {
            var field = $(fieldMap[errObj.field]);
            field.parents('.form-group').addClass('has-error');
        }, this);
        this.ui.alert.show();
    },

    provision: function (e) {
        var self = this;
        e.preventDefault();

        this.model.save(this.extractFormValues(), {
            success: function (m, obj) {
                var job = new Job({uuid: obj.job_uuid});
                var jobView = new JobProgressView({model: job});
                self.listenTo(jobView, 'succeeded', function () {
                    adminui.router.showVm(obj.vm_uuid);
                });
                jobView.show();
            }
        });
    }

});
module.exports = View;
