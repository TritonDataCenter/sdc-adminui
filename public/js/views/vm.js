var Backbone = require('backbone');
var _ = require('underscore');

var Vm = require('../models/vm');
var Img = require('../models/image');
var Server = require('../models/server');
var User = require('../models/user');
var Probes = require('../models/probes');

var VMDeleteModal = require('./vm-delete-modal');
var TagsList = require('./tags-list');
var NicsList = require('./nics');
var MetadataList = require('./metadata');
var SnapshotsList = require('./snapshots');

var ResizeVmView = require('./resize-vm');

var JobProgressView = require('./job-progress');
var VmChangeOwner = require('./vm-change-owner');
var NotesView = require('./notes');
var CreateProbeController = require('../controllers/create-probe');

var adminui = require('../adminui');

var tplVm = require('../tpl/vm.hbs');


/**
 * VmView
 *
 * options.uuid uuid of VM
 * options.vm vm attrs
 */
var VmView = Backbone.Marionette.ItemView.extend({
    template: tplVm,
    id: 'page-vm',
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
        'click .package': 'clickedPackage',
        'click .image-name-version': 'clickedImage',
        'click .resize': 'clickedResize',
        'click .change-owner': 'clickChangeOwner'
    },

    url: function() {
        return _.str.sprintf('vms/%s', this.vm.get('uuid'));
    },

    initialize: function(options) {
        _.bindAll(this);

        this.vent = adminui.vent;

        if (options.uuid) {
            this.vm = new Vm({uuid: options.uuid });
        }

        if (options.vm) {
            this.vm = options.vm;
        }

        this.owner = new User();
        this.image = new Img();
        this.server = new Server();

        this.image.set({
            uuid: this.vm.get('image_uuid')
        });

        if (!this.image.get('updated_at')) {
            this.image.fetch();
        }

        this.server.set({
            uuid: this.vm.get('server_uuid')
        });

        if (!this.server.get('last_modified')) {
            this.server.fetch();
        }

        this.owner.set({
            uuid: this.vm.get('owner_uuid')
        });

        if (!this.owner.get('cn')) {
            this.owner.fetch();
        }


        this.listenTo(this.vm, 'change:image_uuid', function(m) {
            this.image.set({uuid: m.get('image_uuid')});
            this.image.fetch();
        }, this);


        this.listenTo(this.vm, 'change:owner_uuid', function(m) {
            this.owner.set({uuid: m.get('owner_uuid')});
            this.owner.fetch();
        }, this);

        this.listenTo(this.vm, 'change:server_uuid', function(m) {
            this.server.set({uuid: m.get('server_uuid')});
            this.server.fetch();
        }, this);

        this.listenTo(this.vm, 'change:customer_metadata', this.renderMetadata, this);
        this.listenTo(this.vm, 'change:tags', this.renderTags, this);
        this.listenTo(this.vm, 'change:nics', this.renderNics, this);

        this.metadataListView = new MetadataList({vm: this.vm});
        this.tagsListView = new TagsList({vm: this.vm});

        this.vm.fetch();
    },

    clickedStartVm: function(e) {
        var self = this;
        this.vm.start(function(job) {
            var jobView = new JobProgressView({
                model: job
            });
            jobView.show();
        });
    },

    clickedResize: function() {
        var view = new ResizeVmView({
            vm: this.vm
        });
        view.show();
    },

    clickedOwnerName: function(e) {
        e.preventDefault();
        this.vent.trigger('showview', 'user', {
            user: this.owner
        });
    },

    clickedPackage: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        e.preventDefault();
        this.vent.trigger('showview', 'packages', {
            uuid: this.vm.get('billing_id')
        });
    },

    clickedImage: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        e.preventDefault();
        this.vent.trigger('showview', 'image', {
            uuid: this.vm.get('image_uuid')
        });
    },

    clickedCreateProbe: function() {
        var createProbeController = new CreateProbeController({
            vm: this.vm
        });
    },

    clickedStopVm: function(e) {
        var vm = this.vm;
        var confirm = window.confirm('Are you sure you want to stop this VM?');

        if (confirm) {
            this.vm.stop(function(job) {
                var jobView = new JobProgressView({model: job});
                jobView.on('succeeded', function() {
                    vm.fetch();
                });
                jobView.show();
            });
        }
    },

    clickedRebootVm: function(e) {
        var confirm = window.confirm('Are you sure you want to reboot this VM?');
        if (confirm) {
            this.vm.reboot(function(job) {
                var jobView = new JobProgressView({ model: job });
                jobView.show();
            });
        }
    },

    clickedDeleteVm: function(e) {
        var vmDeleteView = new VMDeleteModal({
            vm: this.vm,
            owner: this.owner
        });
        vmDeleteView.show();
    },

    clickChangeOwner: function() {
        var vmChangeOwner = new VmChangeOwner({
            vm: this.vm
        });
        vmChangeOwner.show();
    },

    clickedServerHostname: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        this.vent.trigger('showview', 'server', {
            server: this.server
        });
    },

    clickedRename: function() {
        var vm = this.vm;
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
        input.keyup(function(e) {
            if (e.which === 13) {
                save.click();
            }
        });

        cancel.click(cancelAction);
        save.click(saveAction);

        input.focus();

        function saveAction() {
            value.html(input.val());
            vm.set({ alias: input.val() });
            vm.saveAlias(function(err, job) {
                if (err) {
                    input.tooltip({placement: 'bottom', title: err.message}).tooltip('show');
                } else {
                    adminui.vent.trigger('showjob', job);
                    cancelAction();
                }
            });
        }

        function cancelAction() {
            input.tooltip('hide');
            input.tooltip('destroy');
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
        this.nicsList = new NicsList({
            vm: this.vm,
            el: this.$('.nics')
        });

        this.snapshotsListView = new SnapshotsList({
            vm: this.vm,
            el: this.$('.snapshots')
        });

        this.notesView = new NotesView({
            itemUuid: this.vm.get('uuid'),
            el: this.$('.notes')
        });

        this.notesView.render();

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
                },
                attributes: [{
                    observe: 'uuid',
                    name: 'href',
                    onGet: function(val) {
                        return '/images/'+val;
                    }
                }]
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
            '.vm-state': {
                observe: 'state',
                attributes: [{
                    'name': 'class',
                    onGet: function(state) {
                        return state;
                    }
                }]
            },
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
            '.owner-link': {
                attributes: [{
                    'observe':'owner_uuid',
                    'name': 'class',
                    'onGet': function(v) {
                        return '/users/'+v;
                    }
                }]
            },
            '.billing-id': 'billing_id'
        });

        this.stickit(this.server, {
            '.server-hostname': {
                observe: 'hostname',
                attributes: [{
                    observe: 'uuid',
                    name: 'href',
                    onGet: function(uuid) {
                        return '/servers/'+uuid;
                    }
                }]
            },
            '.server-uuid': 'uuid'
        });


        return this;
    }

});

module.exports = VmView;
