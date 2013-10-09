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
        this.$el.trigger("liszt:updated");
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
var ImageTypeaheadView = require('../tpl/typeahead-image.hbs');
var ServerTypeaheadView = require('../tpl/typeahead-server.hbs');

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
        'typeahead:selected input#input-image': 'onSelectImage',
        'input input#input-image': 'onSelectImage',
        'change select[name="networks[]"]': 'checkFields',
        'blur input[type=text]': 'checkFields',
        'blur input#input-owner': 'onBlurOwnerField'
    },

    modelEvents: {
        'error': 'onError'
    },

    ui: {
        'form': 'form',
        'alert': '.alert',
        'ownerInput': '#input-owner',
        'brandControls': '.control-group-brand'
    },

    initialize: function(options) {
        _.bind(this, this.onSelectImage);
        this.vent = adminui.vent;
        this.model = new Vm();
        this.packages = new Packages();
        this.packageSelect = new PackageSelect({
            collection: this.packages
        });

        this.settings = require('../models/settings');
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
                'tokens': [i.get('uuid'), i.get('version'), i.get('name')],
                'name': i.get('name'),
                'version': i.get('version')
            };
        });

        this.$("input[name=image]").typeahead({
            // name: 'images',
            local: source,
            valueKey: 'uuid',
            cache: false,
            limit: 8,
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
                self.userPreview.close();
            });
        }
    },

    populatePrimaryNetworks: function(selectedNets) {
        var $select = this.$('.primary-network-select select');

        var networks = this.networks;
        var networkPools = this.networkPools;

        var settings = this.settings;

        $select.empty();
        _.each(selectedNets, function(net) {
            var n = networks.get(net.uuid) || networkPools.get(net.uuid);
            var $elm = $("<option />").attr('value', n.get('uuid'));

            if (settings.get('provision.preset_primary_network') === net.uuid) {
                $elm.prop('selected', true);
            }

            if (n.get('subnet')) {
                $elm.html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                $elm.html(n.get('name'));
            }

            $select.append($elm);
        });
    },

    onSelectUser: function(u) {
        this.selectedUser = u;
        this.userPreview.show(new UserPreview({model: u}));

        var settings = this.settings;

        if (this.networks.length) {
            this.networks.reset();
        }

        this.$('.networks-select .chosen').empty();
        this.$('.primary-network-select select').empty();

        var self = this;
        $.when(
            this.settings.fetch(),
            this.networks.fetch({data: {provisionable_by: u.get('uuid') }}),
            this.networkPools.fetch({data: {provisionable_by: u.get('uuid') }})
        ).then(function() {
            var networkPresets = settings.get('provision.preset_networks') || [];

            while (networkPresets.length < 4) {
                networkPresets.push(null);
            }

            _.each(networkPresets, function(uuid) {
                self.createNetworkSelect(uuid);
            });

            var values = self.extractFormValues();
            self.populatePrimaryNetworks(values.networks);
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

    createNetworkSelect: function(uuid) {
        var $select = $('<select data-placeholder="Select a Network" name="networks[]"></select>');
        $select.append("<option></option>");

        var $optgroup = $('<optgroup />').attr('label', 'Networks');
        this.networks.each(function(n) {
            var $elm = $("<option />").attr('value', n.get('uuid'));

            if (uuid === n.get('uuid')) {
                $elm.prop('selected', true);
            }

            if (n.get('subnet')) {
                $elm.html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                $elm.html(n.get('name'));
            }
            $optgroup.append($elm);
        });

        $select.append($optgroup);

        var $optgroup2 = $('<optgroup />').attr('label', 'Network Pools');
        this.networkPools.each(function(n) {
            var $elm = $("<option />").attr('value', n.get('uuid'));

            if (uuid === n.get('uuid')) {
                $elm.prop('selected', true);
            }

            if (n.get('subnet')) {
                $elm.html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                $elm.html(n.get('name'));
            }
            $optgroup.append($elm);
        });

        $select.append($optgroup2);
        $select.show();

        this.$('.networks-select .chosen').append($select);
        $select.chosen({
            width: "200px",
            allow_single_deselect: true
        });
        this.$('.control-group-networks').show();
        this.$('.control-group-primary-network').show();
    },

    onRender: function() {
        this.userInput = new TypeaheadUser({el: this.$('[name=owner]') });
        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.userInput.render();

        this.packageSelect.setElement(this.$('select[name=package]')).render();
        this.$('.control-group-networks').hide();
        this.$('.control-group-primary-network').hide();
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
            image = this.imagesCollection.get(datum.uuid);
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
        this.$('.control-group-brand option').removeAttr('disabled');
        _.each(brands, function(b) {
            this.$('.control-group-brand option[value='+b+']').attr('disabled', true);
        }, this);
    },

    setBrand: function(brand) {
        this.$('.control-group-brand').find('[name=brand]').val(brand);
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

        if (values.networks.length) {
            this.populatePrimaryNetworks(values.networks);
        }

        if (!values.image_uuid && (!values.disks || !values.disks[0] || !values.disks[0].image_uuid)) {
            valid = valid && false;
        } else {
            image_uuid = values['image_uuid'] || values['disks'][0]['image_uuid'];
            valid = valid && true;
        }

        console.log('Current Provision Values', values);

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


        var networksChecked = this.$('.networks-select select').map(function() { return $(this).val(); });
        var primaryNetwork = this.$('.primary-network-select select').val();

        values.networks = _.map(_.compact($.makeArray(networksChecked)), function(nuuid) {
            var net = { uuid: nuuid };
            if (nuuid === primaryNetwork) {
                net.primary = true;
            }

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
