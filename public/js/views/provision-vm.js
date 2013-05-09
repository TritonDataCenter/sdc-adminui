var Backbone = require('backbone');
var _ = require('underscore');


/**
 * ./provision-vm.js
 *
 * Provision a VM
 */

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
var JobProgressView = require('./job-progress');
var PackagePreview = require('./package-preview');

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
    events: {
        'change': 'onChange'
    },
    onChange: function(e) {
        var uuid = $(e.target).val();
        this.trigger('select', this.collection.get(uuid));
    }
});

var ProvisionVmTemplate = require('../tpl/provision-vm.hbs');

var TypeaheadUser = require('./typeahead-user');
var ImageTypeaheadView = require('../tpl/typeahead-image.hbs');
var ServerTypeaheadView = require('../tpl/typeahead-server.hbs');
var View = Backbone.Marionette.ItemView.extend({
    name: 'provision-vm',

    sidebar: 'vms',

    template: ProvisionVmTemplate,

    events: {
        'submit form': 'provision',
        'click .back': 'backToVirtualMachines',
        'typeahead:selected input#input-image': 'onSelectImage',
        'input input#input-image': 'onSelectImage',
        'blur input[type=text]': 'checkFields',
        'blur input#input-owner': 'onBlurOwnerField',
        'change input[type=checkbox]': 'checkFields'
    },

    modelEvents: {
        'error': 'onError'
    },

    ui: {
        'form': 'form',
        'alert': '.alert',
        'ownerInput': '#input-owner'
    },

    initialize: function(options) {
        _.bind(this, this.onSelectImage);
        this.vent = adminui.vent;
        this.model = new Vm();
        this.packages = new Packages();
        this.packageSelect = new PackageSelect({
            collection: this.packages
        });

        this.selectedPackage = new Package();
        this.packagePreview = new PackagePreview({model: this.selectedPackage});

        this.packages.on('reset', function(collection) {
            this.selectedPackage.set(collection.models[0].attributes);
        }, this);

        this.packageSelect.on('select', function(pkg) {
            this.selectedPackage.set(pkg.attributes);
        }, this);

        this.imagesCollection = new Images();
        this.serversCollection = new Servers();
        this.networks = new Networks();
        this.networkPools = new NetworkPools();

        this.listenTo(this.imagesCollection, 'sync', this.prepareImageInput);
        this.listenTo(this.serversCollection, 'sync', this.prepareServerInput);
        this.listenTo(this.networks, 'sync', this.populateNetworks);
        this.listenTo(this.networkPools, 'sync', this.populateNetworks);

        this.imagesCollection.fetch();
        this.serversCollection.fetch();
        this.packages.fetchActive();
    },

    backToVirtualMachines: function() {
        adminui.vent.trigger('showview', 'vms');
    },

    prepareImageInput: function(images) {
        var source = images.map(function(i) {
            return {
                'uuid': i.get('uuid'),
                'tokens': [i.get('uuid'), i.get('name')],
                'name': i.get('name'),
                'version': i.get('version')
            };
        });

        this.$("input[name=image]").typeahead({
            name: 'images',
            local: source,
            valueKey: 'uuid',
            template: ImageTypeaheadView
        });
    },
    prepareServerInput: function(servers) {
        var source = servers.map(function(s) {
            return {
                'uuid': s.get('uuid'),
                'tokens': [s.get('hostname'), s.get('uuid')],
                'hostname': s.get('hostname')
            };
        });

        this.$("input[name=server]").typeahead({
            name: 'servers',
            local: source,
            valueKey: 'uuid',
            template: ServerTypeaheadView
        });
    },


    onBlurOwnerField: function(e) {
        var $field = this.ui.ownerInput;
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
            });
        }
    },

    onSelectUser: function(u) {
        this.selectedUser = u;
        if (this.networks.length) {
            this.networks.reset();
        }
        this.$('.network-checkboxes').find('label').remove();

        this.networks.fetch({data: {provisionable_by: u.get('uuid') }});
        this.networkPools.fetch({data: {provisionable_by: u.get('uuid') }});

        this.sshKeys = new SSHKeys({user: u});
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

    onRender: function() {
        this.userInput = new TypeaheadUser({el: this.$('[name=owner]') });
        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.userInput.render();

        this.packageSelect.setElement(this.$('select[name=package]')).render();
        this.$('.control-group-networks').hide();
        this.$('.package-preview-container').append(this.packagePreview.render().el);

        this.hideError();
        this.$('.control-group-brand').hide();
        this.$('.no-sshkeys-warning').hide();
        this.checkFields();


        return this;
    },
    onShow: function() {
        this.$("input:not([disabled]):first").focus();
    },

    populateNetworks: function(networks) {
        var tpl = this.$('.network-checkbox-template').html();
        var elm = $('<div/>').append(tpl);

        var $container = this.$('.network-checkboxes');
        networks.each(function(n) {
            if (n.get('subnet')) {
                elm.find('.name').html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                elm.find('.name').html(n.get('name'));
            }
            elm.find('input').val(n.get('uuid'));
            $container.prepend(elm.html());
        }, this);

        this.$('.control-group-networks').show();
    },

    onSelectImage: function(e, datum) {
        var image = null;
        if (datum && datum.uuid) {
            image = this.imagesCollection.get(datum.uuid);
        }

        if (! image) {
            this.$('.control-group-brand').hide();
            return;
        }
        if (image && image.requirements && image.requirements['brand']) {
            this.$('.control-group-brand').hide();
        } else {
            this.$('.control-group-brand').show();
        }

        if (image.get('type') === 'zvol') {
            this.$('.control-group-brand').find('[name=brand]').val('kvm');
            this.$('.control-group-brand').hide();
        } else {
            this.$('.control-group-brand').show();
        }

        if (image.get('os') === 'smartos') {
            this.$('.control-group-brand option[value=kvm]').attr('disabled', true);
        } else {
            this.$('.control-group-brand option[value=kvm]').removeAttr('disabled');
            this.$('.control-group-brand').show();
        }
    },

    checkFields: function() {
        this.hideError();
        var values = this.extractFormValues();
        var valid;
        var image_uuid;

        if (!values.owner_uuid.length || !values.networks.length) {
            valid = false;
        } else {
            valid = true;
        }

        if (!values.image_uuid && (!values.disks || !values.disks[0] || !values.disks[0].image_uuid)) {
            valid = valid && false;
        } else {
            image_uuid = values['image_uuid'] || values['disks'][0]['image_uuid'];
            valid = valid && true;
        }

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
            ram: formData.memory,
            owner_uuid: formData.owner,
            brand: formData.brand,
            alias: formData.alias
        };

        if (formData.server) {
            values['server_uuid'] = formData.server;
        }


        if (formData.image.length) {
            var image = this.imagesCollection.get(formData.image);
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
            values['package_name'] = pkg.get('name');
            values['package_version'] = pkg.get('version');
            values['cpu_cap'] = pkg.get('cpu_cap');
            values['max_lwps'] = pkg.get('max_lwps');
            values['max_swap'] = pkg.get('max_swap');

            // quota value needs to be in GiB
            values['quota'] = pkg.get('quota');
            if (values['quota']) {
                values['quota'] = Math.ceil(Number(values['quota']) / 1024);
            }
            values['vcpus'] = pkg.get('vcpus');
            values['zfs_io_priority'] = pkg.get('zfs_io_priority');
            values['ram'] = pkg.get('max_physical_memory');
        }

        if (values['brand'] === 'kvm') {
            values['disks'] = [
                {'image_uuid': values['image_uuid'] },
                {'size': values['quota'] }
            ];
            delete values['image_uuid'];
        }

        if (values['brand'] === 'kvm' && this.userKeys) {
            values.customer_metadata = {
                root_authorized_keys: this.userKeys.join("\n")
            };
        }


        var networksChecked = this.ui.form.find('.network-checkboxes input[type=checkbox]:checked');
        values.networks = _.map(networksChecked, function(obj) {
            return $(obj).val();
        });

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
        this.$('.control-group').removeClass('error');
        _.each(err.errors, function(errObj) {
            var field = $(fieldMap[errObj.field]);
            field.parents('.control-group').addClass('error');
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
