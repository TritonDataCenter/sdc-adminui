define(function(require) {
    
    var BaseView = require('views/base');
    var Vm = require('models/vm');
    var Img = require('models/image');
    var Server = require('models/server');
    var User = require('models/user');
    var Probes = require('models/probes');

    var VMDeleteModal = require('views/vm-delete-modal');
    var TagsList = require('views/tags-list');
    var NicsList = require('views/nics');
    var MetadataList = require('views/metadata');
    var SnapshotsList = require('views/snapshots');
    var CreateProbeController = require('controllers/create-probe');
    var adminui = require('adminui');

    var tplVm = require('text!tpl/vm.html');


    /**
     * VmView
     *
     * options.uuid uuid of VM
     * options.vm vm attrs
     */
     var VmView = Backbone.Marionette.ItemView.extend({
        template: tplVm,

        sidebar: 'vms',

        events: {
            'click .server-hostname': 'clickedServerHostname',
            'click .start': 'clickedStartVm',
            'click .stop': 'clickedStopVm',
            'click .reboot': 'clickedRebootVm',
            'click .delete': 'clickedDeleteVm',
            'click .create-probe': 'clickedCreateProbe',
            'click .rename': 'clickedRename',
            'click .owner-name': 'clickedOwnerName',
            'click .package': 'clickedPackage'
        },

        url: function() {
            return _.str.sprintf('vms/%s', this.vm.get('uuid'));
        },

        initialize: function(options) {
            _.bindAll(this);

            this.vent = adminui.vent;

            if (options.uuid)
                this.vm = new Vm({uuid: options.uuid});
            if (options.vm)
                this.vm = options.vm;

            this.owner = new User();
            this.image = new Img();
            this.server = new Server();

            this.image.set({ uuid: this.vm.get('image_uuid') });
            
            if (! this.image.get('updated_at'))
                this.image.fetch();

            this.server.set({ uuid: this.vm.get('server_uuid') });
            if (! this.server.get('last_modified')) {
                this.server.fetch();
            }

            this.owner.set({ uuid: this.vm.get('owner_uuid') });
            if (! this.owner.get('cn')) {
                this.owner.fetch();
            }


            this.vm.on('change:image_uuid', function(m) {
                this.image.set({uuid: m.get('image_uuid')});
                this.image.fetch();
            }, this);


            this.vm.on('change:owner_uuid', function(m) {
                this.owner.set({uuid: m.get('owner_uuid')});
                this.owner.fetch();
            }, this);

            this.vm.on('change:server_uuid', function(m) {
                this.server.set({uuid: m.get('server_uuid')});
                this.server.fetch();
            }, this);
            
            this.vm.on('change:customer_metadata', function(m) {
                this.renderMetadata();
            }, this);

            this.vm.on('change:tags', function() {
                this.renderTags();
            }, this);

            this.vm.on('change:nics', function() {
                this.renderNics();
            }, this);

            this.metadataListView = new MetadataList({vm: this.vm});
            this.tagsListView = new TagsList({vm: this.vm});

            this.vm.fetch();
        },

        clickedStartVm: function(e) {
            var self = this;
            this.vm.start(function(job) {
                job.name = 'Start VM';
                self.vent.trigger('watch-job', job);
            });
        },

        clickedOwnerName: function(e) {
            e.preventDefault();
            this.vent.trigger('showview', 'user', {user: this.owner });
        },

        clickedPackage: function(e) {
            e.preventDefault();
            this.vent.trigger('showview', 'packages', {uuid: this.vm.get('billing_id') });
        },

        clickedCreateProbe: function() {
            var createProbeController = new CreateProbeController({ vm: this.vm });
        },

        clickedStopVm: function(e) {
            var self = this;
            this.vm.stop(function(job) {
                job.name = 'Stop VM';
                self.vent.trigger('watch-job', job);
            });
        },

        clickedRebootVm: function(e) {
            var self = this;
            this.vm.reboot(function(job) {
                job.name = 'Reboot VM';
                self.event.trigger('watch-job', job);
            });
        },

        clickedDeleteVm: function(e) {
            var vmDeleteView = new VMDeleteModal({ vm: this.vm, owner: this.owner });
            vmDeleteView.render();
        },

        clickedServerHostname: function() {
            this.vent.trigger('showview', 'server', { server:this.server });
        },

        clickedRename: function() {
            var self = this;
            var renameBtn = this.$('.alias .rename');
            var value = this.$('.alias .value');
            
            renameBtn.hide();
            value.hide();

            var input = $('<input type="text">').val(this.vm.get('alias'));
            var save = $('<button class="btn btn-primary btn-mini">').html('Save');
            var cancel = $('<button class="btn btn-cancel btn-mini">').html('Cancel');
            this.$('.alias').append(input);
            this.$('.alias').append(save);
            this.$('.alias').append(cancel);
            cancel.click(cancelAction);
            save.click(saveAction);
            input.focus();

            function saveAction() {
                value.html(input.val());
                self.vm.set({alias: input.val()});
                self.vm.saveAlias();
                cancelAction();
            }
            function cancelAction() {
                renameBtn.show();
                input.remove();
                save.remove();
                cancel.remove();
                value.show();
            }
        },

        renderTags: function() {
            this.tagsListView.setElement(this.$('.tags')).render();
        },

        renderNics: function() {
            this.nicsList.render();
        },

        renderMetadata: function() {
            this.metadataListView.setElement(this.$('.metadata')).render();
        },

        renderSnapshots: function() {
            this.snapshotsListView.render();
        },

        onRender: function() {
            this.nicsList = new NicsList({vm: this.vm, el: this.$('.nics')});
            this.snapshotsListView = new SnapshotsList({vm: this.vm, el: this.$('.snapshots') });

            this.renderTags();
            this.renderMetadata();
            this.renderSnapshots();
            this.renderNics();

            this.stickit(this.image, {
                '.image-uuid': 'uuid',
                '.image-name-version': {
                    observe: ['name', 'version'],
                    onGet: function(val, attr) {
                        return val[0] + val[1];
                    }
                }
            });

            this.stickit(this.owner, {
                '.owner-name': 'cn',
                '.owner-uuid': 'uuid'
            });

            this.stickit(this.vm, {
                '.vm-alias': 'alias',
                '.vm-memory': 'ram',
                '.vm-swap': 'max_swap',
                '.vm-uuid': 'uuid',
                '.vm-state': 'state',
                '.vm-ips': {
                    observe: 'nics',
                    onGet: function(val) {
                        if (val.length) {
                            var ips = _.map(val, function(nic) {
                                return nic.ip;
                            });
                            return ips.join(',');
                        }
                    }
                },
                '.package': {
                    attributes: [{
                        name: 'href',
                        observe: 'billing_id',
                        onGet: function(val) {
                            return '/packages/' + val;
                        }
                    }]
                },
                '.package-name': 'package_name',
                '.package-version': 'package_version',
                '.billing-id': 'billing_id'
            });

            this.stickit(this.server, {
                '.server-hostname': 'hostname',
                '.server-uuid': 'uuid'
            });


            return this;
        }

    });

    return VmView;
});
