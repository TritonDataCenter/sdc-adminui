/**
 * views/provision-vm.js
 *
 * Provision a VM
 */

define(function(require) {
    var Base = require('views/base');
    var Images = require('models/images');
    var Users = require('models/users');
    var Package = require('models/package');
    var Packages = require('models/packages');
    var Servers = require('models/servers');
    var Networks = require('models/networks');
    var Vm = require('models/vm');

    var Job = require('models/job');
    var JobProgressView = require('views/job-progress');
    var PackagePreview = require('views/package-preview');

    var adminui = require('adminui');

    var PackageSelectOption = Backbone.Marionette.ItemView.extend({
        attributes: function() {
            return {
                name: this.model.get('name'),
                value: this.model.get('uuid')
            };
        },
        tagName: 'option',
        template: Handlebars.compile('{{name}} {{version}}')
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

    var tplProvisionVm = require('tpl!provision-vm');

    var View = Backbone.Marionette.ItemView.extend({
        name: 'provision-vm',

        sidebar: 'vms',

        template: _.template(tplProvisionVm),

        events: {
            'submit form': 'provision',
            'change input': 'checkFields'
        },

        modelEvents: {
            'error': 'onError'
        },

        ui: {
            'form': 'form',
            'alert': '.alert'
        },

        initialize: function(options) {
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

            this.imagesSource = [];
            this.usersSource = [];
            this.serversSource = [];

            this.usersCollection = new Users();
            this.imagesCollection = new Images();
            this.serversCollection = new Servers();
            this.networks = new Networks();

            this.usersCollection.on('reset', function(users) {
                this.userSource = [];
                users.each(function(u) {
                    this.usersSource.push(u);
                }, this);
            }, this);

            this.imagesCollection.on('reset', function(images) {
                images.each(function(u) {
                    this.imagesSource.push(u);
                }, this);
            }, this);

            this.serversCollection.on('reset', function(servers) {
                servers.each(function(u) {
                    this.serversSource.push(u);
                }, this);
            }, this);

            this.networks.on('reset', function(networks) {
                this.populateNetworks(networks);
            }, this);

            this.imagesCollection.fetch();
            this.usersCollection.searchByLogin('');
            this.networks.fetch();
            this.serversCollection.fetch();
            this.packages.fetchActive();
        },

        onRender: function() {
            this.packageSelect.setElement(this.$('select[name=package]')).render();
            this.$('.package-preview-container').html(this.packagePreview.render().el);

            this.hideError();

            this.$("input[name=image]").typeahead({
                source: this.imagesSource,
                labeler: function(obj) {
                    return [obj.get('name'), obj.get('version')].join(" ");
                },
                valuer: function(obj) {
                    return obj.get('uuid');
                }
            });

            this.$("input[name=server]").typeahead({
                source: this.serversSource,
                labeler: function(obj) {
                    return obj.get('hostname');
                },
                valuer: function(obj) {
                    return obj.get('uuid');
                }
            });


            this.$("input[name=owner]").typeahead({
                source: this.usersSource,
                labeler: function(obj) {
                    return [obj.get('login'), obj.get('cn')].join(" - ");
                },
                valuer: function(obj) {
                    return obj.get('uuid');
                }
            });

            this.checkFields();

            return this;
        },

        populateNetworks: function(networks) {
            var container = this.$('.network-checkboxes');
            var elm = container.find('label:first').clone();
            container.find('label').remove();
            networks.each(function(n) {
                elm.find('.name').html(
                [n.get('name'), n.get('subnet')].join(' - '));
                elm.find('input').val(n.get('uuid'));
                elm.clone().prependTo(container);
            }, this);
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


            if (image_uuid) {
                var image = this.imagesCollection.get(image_uuid);
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
            } else {
                this.$('.control-group-brand').show();
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

            if (formData.image) {
                var image = this.imagesCollection.get(formData.image);
                var imageReqs = image.get('requirements') || {};

                if (imageReqs['brand'] === 'kvm') {
                    values['brand'] = 'kvm';
                }
                if (image.get('type') === 'zvol') {
                    values['brand'] = 'kvm';
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
                values['quota'] = pkg.get('quota');
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
                    self.bindTo(jobView, 'execution', function(status) {
                        if (status == 'succeeded') {
                            adminui.vent.trigger('showview', {uuid: obj.vm_uuid});
                        }
                    });
                    jobView.show();
                }
            });
        }

    });
    return View;
});