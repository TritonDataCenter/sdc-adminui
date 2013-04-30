var Backbone = require('backbone');
var _ = require('underscore');


var adminui = require('../adminui');

var JSONEditor = require('./traits-editor');
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
                    message: 'Traits updated'
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
        var image = this.model;
        this.listenTo(modal, 'save', function(traits) {
            image.save(
                { traits: traits},
                { patch: true }
                ).done(function() {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'Traits updated'
                });
                modal.close();
            });
        });
    },

    onClickChangePublicity: function() {
        var newVal = !this.model.get('public');
        var self = this;
        this.model.save({'public': newVal}, {success: function() {
            self.model.fetch();
        }});
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
        } else {
            if (model.get('uploading') === false) {
                this.$(".file").removeClass("to-be-removed");
            }
            this.$('.upload').hide();
        }
        this.$('.upload button.start-upload').attr("disabled", 'disabled');
    },

    onError: function(model, res) {
        adminui.vent.trigger('error', {
            xhr: res,
            context: 'images / imgapi'
        });
    },

    onRender: function() {
        this.$("li.progress").hide();
    },

    onClickActivate: function(e) {
        e.preventDefault();
        var self = this;
        this.model.activate(function() {
            self.model.fetch();
        });
    },

    onClickDisable: function(e) {
        e.preventDefault();
        var self = this;
        this.model.disable(function() {
            self.model.fetch();
        });
    },

    onClickEnable: function(e) {
        e.preventDefault();
        var self = this;
        this.model.enable(function() {
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
        xhr.setRequestHeader("Content-type", file.type);
        xhr.setRequestHeader("content-length", file.size);
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
        var self = this;
        this.viewModel.set({progress: false});
        this.viewModel.set({uploading: false});
        this.model.fetch();
    },

    onUploadFailed: function(e) {
        this.viewModel.set({uploading: false});
        console.log(e);
    },

    onUploadCancelled: function(e) {
        this.viewModel.set({uploading: false});
        console.log(e);
    }

});

module.exports = ImageView;
