var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var adminui = require('../adminui');

var React = require('react');
var ImageAclComponent = require('../components/image-acl.jsx');
var NotesComponent = require('../components/notes');


var JSONEditor = require('./traits-editor');
var TagsListView = require('./tags-list');
var Img = require('../models/image');
var ImageView = Backbone.Marionette.ItemView.extend({

    id: 'page-image',

    sidebar: 'images',

    template: require('../tpl/image.hbs'),

    url: function() {
        return _.str.sprintf('images/%s', this.model.get('uuid'));
    },

    events: {
        'click .activate': 'onClickActivate',
        'click .disable': 'onClickDisable',
        'click .enable': 'onClickEnable',
        'click .origin': 'onClickOrigin',
        'click .add-file': 'onClickAddFile',
        'click .show-upload-form': 'onClickShowUploadForm',
        'click .cancel-upload-form': 'onClickCancelUploadForm',
        'click .start-upload': 'onClickStartUpload',
        'click .change-publicity': 'onClickChangePublicity',
        'click .add-image-acl': 'onClickAddImageAcl',
        'click .manage-traits': 'onClickManageTraits',
        'click .manage-tags': 'onClickManageTags',
        'change .fileinput': 'onSelectFile'
    },

    modelEvents: {
        'change': 'render',
        'error': 'onError'
    },

    templateHelpers: {
        'active': function() {
            return this.state === 'active';
        },

        'unactivated': function() {
            return this.state === 'unactivated';
        },

        'enableable': function() {
            return this.disabled === true;
        },

        'disableable': function() {
            return this.disabled === false;
        }
    },

    initialize: function(options) {
        if (options.uuid) {
            this.model = new Img({uuid: options.uuid});
        } else if (options.image) {
            this.model = options.image;
        }
        this.model.fetch();
        this.listenTo(this.model, 'sync', this.onImageReady, this);

        this.viewModel = new Backbone.Model();
        this.listenTo(this.viewModel, 'change:uploadform', this.onChangeUploadForm, this);
        this.listenTo(this.viewModel, 'change:progress', this.onChangeProgress, this);
        this.listenTo(this.viewModel, 'change:file', this.onChangeFile, this);
        this.viewModel.set({
            uploadform: false,
            uploading: false
        });
    },

    onClickShowUploadForm: function() {
        this.viewModel.set({uploadform:true});
    },

    onClickCancelUploadForm: function() {
        this.viewModel.set({uploadform:false});
    },

    onClickManageTags: function() {

        var server = this.model;
        var modal = new JSONEditor({
            title: _.str.sprintf('Tags for image: %s', this.model.get('name')),
            data: this.model.get('tags')
        });

        modal.show();
        modal.on('save', function(data) {
            server.save(
                {tags: data},
                {patch: true}
                ).done(function() {
                modal.close();
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'Tags updated'
                });
            });
        });
    },


    onClickManageTraits: function() {
        var modal = new JSONEditor({
            title: _.str.sprintf('Traits for image: %s', this.model.get('name')),
            data: this.model.get('traits')
        });
        modal.show();
        modal.on('save', function(traits) {
            this.model.save(
                { traits: traits},
                { patch: true }
                ).done(function() {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'Traits updated'
                });
                modal.close();
            });
        }, this);
    },

    onClickChangePublicity: function() {
        var newVal = !this.model.get('public');
        var message = 'Image has been made ';

        if (newVal) {
            message += '<strong>public</strong>';
        } else {
            message += '<strong>private</strong>';
        }
        var self = this;
        this.model.save(
            {'public': newVal},
            {patch: true}
        ).done(function() {
            adminui.vent.trigger('notification', {
                level: 'success',
                message: message
            });
        });
    },

    onChangeProgress: function(model, value) {
        if (value) {
            this.$('li.progress').show();
        } else {
            this.$('li.progress').fadeOut();
        }
    },

    onImageReady: function() {
        var self = this;
        if (this.model.get('origin')) {
            var origin = self.origin = new Img({uuid: this.model.get('origin')});
            origin.fetch().done(function() {
                self.$('.origin-name-version').html(origin.nameWithVersion());
            });
        }
    },

    onChangeUploadForm: function(model, value) {
        if (value) {
            this.$('.add-file').html('Select image file to upload');
            this.$(".file").addClass("to-be-removed");
            this.$('.upload').show();
            this.$('.show-upload-form').hide();
        } else {
            this.$('.show-upload-form').show();
            this.$('.upload').hide();
            if (model.get('uploading') === false) {
                this.$(".file").removeClass("to-be-removed");
            }
        }
        this.$('.upload button.start-upload').prop("disabled", true);
    },

    onClickOrigin: function(e) {
        e.preventDefault();
        adminui.vent.trigger('showview', 'image', {uuid: this.origin.get('uuid')});
    },

    onError: function(model, res) {
        adminui.vent.trigger('error', {
            xhr: res,
            context: 'images / imgapi'
        });
    },

    onRender: function() {
        this.$("li.progress").hide();
        this.tagsList = new TagsListView({model: this.model});
        this.tagsList.setElement(this.$('.tags-container'));
        this.tagsList.render();


        if (adminui.user.role('operators')) {
            this.notesComponent = React.renderComponent(
                new NotesComponent({item: this.model.get('uuid')}),
                this.$('.notes-component-container').get(0));
        }
        var self = this;

        this.imageAclComponent = React.renderComponent(
            new ImageAclComponent({
                owner: this.model.get('owner'),
                public: this.model.get('public'),
                handleAddAcl: function(u) {
                    self.model.addAcl([u]).done(function() {
                        adminui.vent.trigger({
                            level: 'success',
                            message: 'Image ACL has been activated.'
                        });
                        self.model.fetch();
                    });
                },
                acl: this.model.get('acl')}),
            this.$('.acl-container').get(0));

        this.renderBillingTags();
    },
    renderBillingTags: function() {
        var model = this.model;
        var billingTags = this.model.get('billing_tags') || [];
        var readOnly = !adminui.user.role('operators');

        var tagsWidget = this.$('.billing-tags').tags({
            promptText: 'Enter new tag',
            readOnly: readOnly,
            tagData: billingTags,
            caseInsensitive: false,
            afterAddingTag: change,
            afterDeletingTag: change
        });

        function change() {
            model.save({billing_tags: tagsWidget.getTags() }, {patch: true, silent: true});
        }
    },


    onClickActivate: function(e) {
        e.preventDefault();
        var self = this;
        this.model.activate(function() {
            adminui.vent.trigger({
                level: 'success',
                message: 'Image has been activated.'
            });
            self.model.fetch();
        });
    },

    onClickDisable: function(e) {
        e.preventDefault();
        var self = this;
        this.model.disable(function() {
            adminui.vent.trigger({
                level: 'success',
                message: 'Image has been disabled.'
            });
            self.model.fetch();
        });
    },

    onClickEnable: function(e) {
        e.preventDefault();
        var self = this;
        this.model.enable(function() {
            adminui.vent.trigger({
                level: 'success',
                message: 'Image has been enabled.'
            });
            self.model.fetch();
        });
    },

    onClickAddFile: function() {
        this.$('.fileinput').click();
    },

    onChangeFile: function(model, file) {
        if (file) {
            this.$('.upload button.start-upload').removeAttr("disabled");
            this.$('.add-file').html(file.name);
        } else {
            this.$('.upload button.start-upload').attr("disabled", "disabled");
        }
    },

    onSelectFile: function(e) {
        var file = e.target.files[0] || e.dataTransfer.files[0];
        this.viewModel.set({file:file});
    },

    onClickAddImageAcl: function() {
        this.imageAclComponent.setProps({ form: true });
    },

    onClickStartUpload: function() {
        var xhr = new XMLHttpRequest();
        var file = this.viewModel.get('file');
        var compression = $('.upload .compression select').val();

        xhr.upload.addEventListener("progress", this.onUploadProgress.bind(this), false);
        xhr.addEventListener("load", this.onUploadComplete.bind(this), false);
        xhr.addEventListener("error", this.onUploadFailed.bind(this), false);
        xhr.addEventListener("abort", this.onUploadCancelled.bind(this), false);

        xhr.open("PUT", this.model.url() + "/file");
        xhr.setRequestHeader("content-type", file.type);
        xhr.setRequestHeader("x-file-compression", compression);
        xhr.setRequestHeader('x-adminui-token', $.ajaxSettings.headers['x-adminui-token']);
        xhr.send(file);

        this.viewModel.set({uploadform: false});
        this.viewModel.set({uploading: true});
        this.viewModel.set({progress: true});
        return false;
    },

    onUploadProgress: function(e) {
        var pct = Math.floor(e.loaded/e.total * 100).toString() + '%';
        this.$('li.progress .bar').css('width', pct);
    },

    onUploadComplete: function(e) {
        this.viewModel.set({progress: false});
        this.viewModel.set({uploading: false});
        adminui.vent.trigger('notificication', {
            level: 'success',
            message: 'Image file has been saved.'
        });
        this.model.fetch();
    },

    onUploadFailed: function(e) {
        this.viewModel.set({uploading: false});
    },

    onUploadCancelled: function(e) {
        this.viewModel.set({uploading: false});
    }

});

module.exports = ImageView;
