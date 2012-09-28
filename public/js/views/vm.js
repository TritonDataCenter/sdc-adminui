define(function(require) {

    var BaseView = require('views/base');
    var Vm = require('models/vm');
    var Img = require('models/image');
    var Server = require('models/server');
    var User = require('models/user');
    var Probes = require('models/probes');

    var VMDeleteModal = require('views/vm-delete-modal');
    var TagsList = require('views/tags-list');
    var MetadataList = require('views/metadata');
    var CreateProbeController = require('controllers/create-probe');


    var tplVm = require('text!tpl/vm.html');


    /**
     * VmView
     *
     * options.uuid uuid of VM
     * options.vm vm attrs
     */
     var VmView = BaseView.extend({
        template: tplVm,

        sidebar: 'vms',

        events: {
            'click .server-hostname': 'clickedServerHostname',
            'click .start': 'clickedStartVm',
            'click .stop': 'clickedStopVm',
            'click .reboot': 'clickedRebootVm',
            'click .delete': 'clickedDeleteVm',
            'click .create-probe': 'clickedCreateProbe',
            'click .rename': 'clickedRename'
        },

        uri: function() {
            return _.str.sprintf('vms/%s', this.vm.get('uuid'));
        },

        initialize: function(options) {
            _.bindAll(this);

            if (options.uuid)
                this.vm = new Vm({uuid: options.uuid});
            if (options.vm)
                this.vm = options.vm;

            this.owner = new User();
            this.image = new Img();
            this.server = new Server();

            this.image.on('change', this.renderImage, this);
            this.server.on('change', this.renderServer, this);
            this.owner.on('change', this.renderOwner, this);

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

            this.vm.on('change:alias', this.render, this);
            this.vm.fetch();

            this.metadataListView = new MetadataList({vm:this.vm});
            this.tagsListView = new TagsList({vm:this.vm});
        },

        compileTemplate: function() {
            return this.template({
                vm: this.vm,
                image: this.image,
                server: this.server,
                owner: this.owner
            });
        },

        clickedStartVm: function(e) {
            var self = this;
            this.vm.start(function(job) {
                job.name = 'Start VM';
                self.eventBus.trigger('watch-job', job);
            });
        },

        clickedCreateProbe: function() {
            var createProbeController = new CreateProbeController({ vm: this.vm });
        },

        clickedStopVm: function(e) {
            var self = this;
            this.vm.stop(function(job) {
                job.name = 'Stop VM';
                self.eventBus.trigger('watch-job', job);
            });
        },

        clickedRebootVm: function(e) {
            var self = this;
            this.vm.reboot(function(job) {
                job.name = 'Reboot VM';
                self.eventBus.trigger('watch-job', job);
            });
        },

        clickedDeleteVm: function(e) {
            var vmDeleteView = new VMDeleteModal({ vm: this.vm, owner: this.owner });
            vmDeleteView.render();
        },

        clickedServerHostname: function() {
            this.eventBus.trigger('wants-view', 'server', { server:this.server });
        },

        clickedRename: function() {
          var self = this;
          var renameBtn = this.$('.alias .rename');
          var value = this.$('.alias .value');

          renameBtn.hide();
          value.hide();

          var input = $('<input type="text">').val(this.vm.get('alias'))
          var save = $('<button class="btn btn-primary btn-mini">').html('Save');
          var cancel = $('<button class="btn btn-cancel btn-mini">').html('Cancel');
          this.$('.alias').append(input);
          this.$('.alias').append(save)
          this.$('.alias').append(cancel)
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

        renderImage: function() {
            this.$('.image-name-version').html(this.image.nameWithVersion());
            this.$('.image-uuid').html(this.image.get('uuid'));

            return this;
        },

        renderTags: function() {
            this.tagsListView.setElement(this.$('.tags')).render();
        },

        renderMetadata: function() {
            this.metadataListView.setElement(this.$('.metadata')).render();
        },

        renderServer: function() {
            this.$('.server-hostname').html(this.server.get('hostname'));
            this.$('.server-uuid').html(this.server.get('uuid'));
        },

        renderOwner: function() {
            this.$('.owner-name').html(this.owner.get('cn'));
            this.$('.owner-uuid').html(this.owner.get('uuid'));

            return this;
        },

        render: function() {
            this.$el.html(this.compileTemplate());

            this.renderImage();
            this.renderTags();
            this.renderMetadata();
            return this;
        }

    });

    return VmView;
});
