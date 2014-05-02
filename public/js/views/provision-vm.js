/** @jsx React.DOM **/

var Backbone = require('backbone');
var _ = require('underscore');
var Bloodhound = require('bloodhound');


/**
 * ./provision-vm.js
 *
 * Provision a VM
 */

var React = require('react');
var NicConfigComponent = require('../components/nic-config');
var MultiNicConfigComponent = require('../components/multi-nic-config');

var Images = require('../models/images');
var Users = require('../models/users');
var Package = require('../models/package');
var Packages = require('../models/packages');
var SSHKeys = require('../models/sshkeys');
var Servers = require('../models/servers');
var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');
var User = require('../models/user');
var Vm = require('../models/vm');
var Job = require('../models/job');

var TypeaheadServerView = require('./typeahead-server');
var TypeaheadImageView = require('./typeahead-image');

var JobProgressView = require('./job-progress');
var PackagePreview = require('./package-preview');
var UserPreview = require('./user-preview');

var adminui = require('../adminui');


var PackageSelectOption = Backbone.Marionette.ItemView.extend({
    attributes: function() {
        return {
            name: this.model.get('name'),
            value: this.model.get('uuid')
        };
    },
    tagName: 'option',
    template: function(data) {
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
    onSync: function(e) {
        this.$el.trigger("chosen:updated");
    },
    onRender: function() {
        this.$el.prepend('<option></option>');
        this.$el.chosen({
            disable_search_threshold: 5,
            width: '280px'
        });
    },
    onChange: function(e) {
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
        'blur input#input-owner': 'onBlurOwnerField'
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

    initialize: function(options) {
        this.vent = adminui.vent;
        this.model = new Vm();
        this.packages = new Packages();
        this.packageSelect = new PackageSelect({
            collection: this.packages
        });

        this.nicSelects = [];

        this.settings = require('../models/settings');
        this.selectedPackage = new Package();
        this.packagePreview = new PackagePreview({model: this.selectedPackage});

        this.packages.on('reset', function(collection) {
            this.selectedPackage.set(collection.models[0].attributes);
        }, this);

        this.packageSelect.on('select', function(pkg) {
            this.selectedPackage.set(pkg.attributes);
        }, this);

        this.packages.fetchActive();
    },

    backToVirtualMachines: function() {
        adminui.vent.trigger('showview', 'vms');
    },

    onBlurOwnerField: function(e) {
        var $field = this.ui.ownerInput;
        var self = this;
        if (this.selectedUser && $field.val() === this.selectedUser.get('uuid')) {
            return;
        }
        if ($field.val().length === 36) {
            var u = new User({uuid: $field.val()});
            u.fetch().done(function() {
                this.onSelectUser(u);
            }.bind(this));
        } else {
            process.nextTick(function() {
                $field.val('');
                self.$('.form-group-networks').hide();
                self.userPreview.close();
                self.removeAllNics();
            });
        }
    },

    removeNic: function(nic) {
        if (this.nicSelects.length === 1) {
            alert('Cannot Remove last Network Interface');
            return false;
        }
        var self = this;
        React.unmountComponentAtNode(nic.getDOMNode());
        $(nic.getDOMNode()).closest('.nic-config-container').fadeOut(function() {
            this.remove();
            self.nicSelects = _.without(self.nicSelects, nic);
            console.debug(self.nicSelects.length);
        });
    },
    removeAllNics: function() {
        _.each(this.nicSelects, function(nic) {
            React.unmountComponentAtNode(nic.getDOMNode());
            $(nic.getDOMNode()).closest('.nic-config-container').remove();
        }, this);
        this.nicSelects = [];
    },

    onSelectUser: function(u) {
        this.selectedUser = u;
        this.userPreview.show(new UserPreview({model: u}));
        this.removeAllNics();

        var settings = this.settings;

        var self = this;

        $.when(
            this.settings.fetch()
        ).then(function() {
            var networkPresets = settings.get('provision.preset_networks') || [];

            while (networkPresets.length < 1) {
                networkPresets.push({primary: true});
            }

            self.renderMultiNicSelect(networkPresets);

            var values = self.extractFormValues();
            self.checkFields();
        });


        this.sshKeys = new SSHKeys(null, {user: u});
        this.listenTo(this.sshKeys, 'sync', this.onFetchKeys);
        this.sshKeys.fetch();
    },

    onFetchKeys: function(collection) {
        if (this.sshKeys.length === 0) {
            this.$('.no-sshkeys-warning').show();
        } else {
            this.$('.no-sshkeys-warning').hide();
        }
        this.userKeys = this.sshKeys.map(function(k) {
            return k.get('openssh');
        });
    },

    showNoSshkeysWarning: function() {
        this.$('.no-sshkeys-warning').show();
    },

    onNicConfigChange: function(nics) {
        this.selectedNics = nics;
        this.checkFields();
    },

    renderMultiNicSelect: function(nics) {
        nics = nics.map(function(nic) {
            if (typeof(nic) === 'string') {
                nic = {network_uuid: nic};
            }
            return nic;
        });

        React.renderComponent(
            MultiNicConfigComponent({
                expandAntispoofOptions: false,
                networkFilters: {provisionable_by: this.selectedUser.get('uuid')},
                nics: nics,
                onChange: this.onNicConfigChange.bind(this)
            }), this.$('.network-selection').get(0));

        this.$('.form-group-networks').show();
        this.$('.form-group-primary-network').show();
    },

    onRender: function() {
        this.userInput = new TypeaheadUser({el: this.$('[name=owner]') });
        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.userInput.render();

        this.serverInput = new TypeaheadServerView({el: this.$('input[name=server]')});
        this.serverInput.render();

        this.imageInput = new TypeaheadImageView({el: this.$('input[name=image]')});
        this.listenTo(this.imageInput, 'selected', this.onSelectImage);
        this.imageInput.render();


        this.packageSelect.setElement(this.$('select[name=package]')).render();
        this.$('.form-group-networks').hide();
        this.$('.package-preview-container').append(this.packagePreview.render().el);

        this.hideError();
        this.ui.brandControls.hide();
        this.$('.no-sshkeys-warning').hide();
        this.checkFields();

        return this;
    },

    onShow: function() {
        this.$("input:not([disabled]):first").focus();
    },

    onSelectImage: function(e, datum) {
        var image = null;
        if (datum && datum.uuid) {
            image = this.imageInput.imagesCollection.get(datum.uuid);
        }

        if (! image) {
            this.ui.brandControls.hide();
            return;
        }

        if (image &&
            image.requirements &&
            image.requirements.brand &&
            typeof(image.requirements.brand) === 'string') {
            this.setBrand(image.requirements.brand);
            this.ui.brandControls.hide();
        } else {
            if (image.get('type') === 'zvol') {
                this.setBrand('kvm');
                this.disableBrands('joyent');
                this.ui.brandControls.hide();
            } else if (image.get('type') === 'zone-dataset') {
                this.setBrand('joyent');
                this.disableBrands('kvm');
                this.ui.brandControls.hide();
            } else {
                this.ui.brandControls.show();
                this.disableBrands(false);
            }
        }
    },

    disableBrands: function() {
        var brands = [];
        if (arguments[0] !== false) {
            brands = arguments;
        }
        this.$('.form-group-brand option').removeAttr('disabled');
        _.each(brands, function(b) {
            this.$('.form-group-brand option[value='+b+']').attr('disabled', true);
        }, this);
    },

    setBrand: function(brand) {
        this.$('.form-group-brand').find('[name=brand]').val(brand);
    },

    checkFields: function() {
        this.hideError();

        var values = this.extractFormValues();
        var valid;
        var image_uuid;

        if (!values.owner_uuid ||
            !values.owner_uuid.length ||
            !values.networks ||
            !values.networks.length) {
            valid = false;
        } else {
            valid = true;
        }

        // if (values.alias && values.alias.length != 0) {
        //     delete values.alias;
        // }

        if (!values.image_uuid && (!values.disks || !values.disks[0] || !values.disks[0].image_uuid)) {
            valid = valid && false;
        } else {
            image_uuid = values['image_uuid'] || values['disks'][0]['image_uuid'];
            valid = valid && true;
        }

        var primaryNetwork = _.findWhere(values.networks, {primary: true});

        if (! primaryNetwork) { valid = false; }

        _.map(values.networks, function(n) {
            if (typeof(n.uuid) !== 'string' || n.uuid.length === 0) {
                valid = false;
            }
        });


        if (valid) {
            this.enableProvisionButton();
        } else {
            this.disableProvisionButton();
        }
    },

    disableProvisionButton: function() {
        this.$('button[type=submit]').attr('disabled', 'disabled');
    },

    enableProvisionButton: function() {
        this.$('button[type=submit]').removeAttr('disabled');
    },

    extractFormValues: function() {
        var formData = this.ui.form.serializeObject();
        var values = {
            image_uuid: formData.image,
            owner_uuid: formData.owner,
            brand: formData.brand
        };

        if (formData.alias && formData.alias.length) {
            values.alias = formData.alias;
        }

        if (formData.server) {
            values['server_uuid'] = formData.server;
        }


        if (formData.image.length) {
            var image = this.imageInput.imagesCollection.get(formData.image);
            if (image) {
                var imageReqs = image.get('requirements') || {};

                if (imageReqs['brand'] === 'kvm') {
                    values['brand'] = 'kvm';
                }
                if (image.get('type') === 'zvol') {
                    values['brand'] = 'kvm';
                }
            }
        }

        var pkg = this.packages.get(formData['package']);

        if (pkg) {
            values['billing_id'] = pkg.get('uuid');

            // quota value needs to be in GiB
            var quotaMib = pkg.get('quota');
            if (quotaMib) {
                quotaMib = Number(quotaMib);
                values['quota'] = Math.ceil(Number(quotaMib) / 1024);
            }


            if (values['brand'] === 'kvm') {
                // disk size passed in as MiB.
                values['disks'] = [
                    {'image_uuid': values['image_uuid'] },
                    {'size': quotaMib }
                ];

                // KVM does not need top level image_uuid and quota passed in
                delete values['image_uuid'];
                delete values['quota'];
            }

            if (values['brand'] === 'kvm' && this.userKeys) {
                values.customer_metadata = {
                    root_authorized_keys: this.userKeys.join("\n")
                };
            }
        }



        values.networks = _.map(this.selectedNics, function(nic) {
            var net = _.clone(nic);
            net.uuid = net.network_uuid;
            delete net.network_uuid

            return net;
        });

        console.log("Provision Values:", values);

        return values;
    },

    hideError: function() {
        this.ui.alert.hide();
    },

    onError: function(model, xhr, options) {
        var fieldMap = {
            'image_uuid': '[name=image]',
            'alias': '[name=alias]',
            'owner_uuid': '[name=owner]',
            'server_uuid': '[name=server]'
        };
        var err = xhr.responseData;
        this.ui.alert.find('.message').html(err.message);
        this.$('.form-group').removeClass('error');
        _.each(err.errors, function(errObj) {
            var field = $(fieldMap[errObj.field]);
            field.parents('.form-group').addClass('error');
        }, this);
        this.ui.alert.show();
    },





    provision: function(e) {
        var self = this;
        e.preventDefault();

        this.model.save(this.extractFormValues(), {
            success: function(m, obj) {
                var job = new Job({uuid: obj.job_uuid});
                var jobView = new JobProgressView({model: job});
                self.listenTo(jobView, 'succeeded', function() {
                    adminui.vent.trigger('showview', 'vm', {uuid: obj.vm_uuid});
                });
                jobView.show();
            }
        });
    }

});
module.exports = View;
