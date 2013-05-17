var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');


var app = require('../adminui');
var Images = require('../models/images');
var ImagesList = require('./images-list');

var ImportImageSelectorItem = ImagesList.prototype.itemView.extend({
    template: require('../tpl/image-import-select-item.hbs'),
    events: {
        'click td': 'startImport'
    },
    startImport: function(e) {
        e.preventDefault();
        var confirm = window.confirm('Confirm import image: ' + this.model.nameWithVersion());
        if (confirm === false) {
            return;
        }
        var self = this;
        var source = this.model.collection.params.repository;
        var uuid = this.model.get('uuid');

        var elm = $('<div class="image-importing modal"><div class="modal-body"><h1>' + this.model.get("name") + ' ' + this.model.get("version") + '<br> <small> is now being imported</small> <br><i class="icon-beer"></i><br><img src="/img/job-progress-loading.gif"></div></div>');
        elm.modal();

        this.listenTo(this.model, 'import:done', function(img) {
            elm.modal('hide').remove();
            app.vent.trigger('showview', 'image', {image: img });
            app.vent.trigger('notification', {
                level: 'success',
                message: 'Image imported successfully'
            });
        });

        this.listenTo(this.model, 'import:error', function(err) {
            elm.modal('hide').remove();
            app.vent.trigger('notification', {
                level: 'error',
                message: err.message
            });
        });

        this.model.adminImportRemote();
    }
});


var ImportImageSelector = ImagesList.extend({
    attributes: {
        'class': 'images-list image-import-selector'
    },
    emptyView: require('./empty').extend({columns: 3}),
    itemView: ImportImageSelectorItem
});


var ImageImportView = Backbone.Marionette.Layout.extend({
    id: 'page-image-import',
    sidebar: 'images',
    url: 'image-import',
    template: require('../tpl/image-import.hbs'),
    regions: function() {
        return { imagesList: '.images-list-region' };
    },
    events: {
        'change select': 'onChangeSource',
        'click button.import': 'importImage'
    },

    showError: function(message) {
        app.vent.trigger('notification', {
            level: 'error',
            message: message
        });
    },

    onChangeSource: function() {
        var repo = this.$('.image-source').val();
        var collection = new Images([], {
            params: { repository: repo }
        });
        var imagesListView = new ImportImageSelector({collection: collection });
        this.imagesList.show(imagesListView);
        this.$('h3').html('Showing images on: ' + repo).show();
    },

    onShow: function() {
        this.$('h3').hide();
        this.onChangeSource();
    }

});

module.exports = ImageImportView;
