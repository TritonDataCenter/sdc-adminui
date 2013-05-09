var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');


var adminui = require('../adminui');

var JSONEditor = require('./traits-editor');
var TagsListView = require('./tags-list');
var Img = require('../models/image');
var ImageView = Backbone.Marionette.ItemView.extend({
    sidebar: 'images',
    id: 'page-image',
    template: require('../tpl/image.hbs'),
    url: function() {
        return _.str.sprintf('images/%s', this.model.get('uuid'));
    },

    events: {
        'click .activate': 'onClickActivate',
        'click .disable': 'onClickDisable',
        'click .enable': 'onClickEnable',
        'click .add-file': 'onClickAddFile',
        'click .show-upload-form': 'onClickShowUploadForm',
        'click .cancel-upload-form': 'onClickCancelUploadForm',
        'click .start-upload': 'onClickStartUpload',
        'click .change-publicity': 'onClickChangePublicity',
        'click .traits': 'onClickManageTraits',
        'click .tags': 'onClickManageTags',
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
        this.viewModel = new Backbone.Model();
        this.viewModel.set({
            uploadform: false,
            uploading: false
        });

        if (options.uuid) {
            this.model = new Img({uuid: options.uuid});
        } else if (options.image) {
            this.model = options.image;
        }
        this.model.fetch();

        this.listenTo(this.viewModel, 'change:uploadform', this.onChangeUploadForm, this);
        this.listenTo(this.viewModel, 'change:progress', this.onChangeProgress, this);
        this.listenTo(this.viewModel, 'change:file', this.onChangeFile, this);
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
        console.log(pct);
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
