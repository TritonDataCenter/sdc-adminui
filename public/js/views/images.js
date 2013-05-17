var Backbone = require('backbone');

var moment = require('moment');
var app = require('../adminui');

var ImagesCollection = require('../models/images');
var ImagesListView = require('./images-list');
var ImagesView = Backbone.Marionette.Layout.extend({
    id: 'page-images',
    template: require('../tpl/images.hbs'),
    url: 'images',
    sidebar: 'images',
    regions: function() {
        return {
            'imagesList': '.images-list-region'
        };
    },
    events: {
        'click .import-image': 'onClickImportImage'
    },
    onShow: function() {
        var imagesListView = new ImagesListView({collection: new ImagesCollection() });
        this.imagesList.show(imagesListView);
    },
    onClickImportImage: function() {
        app.vent.trigger('showview', 'image-import');
    }
});

module.exports = ImagesView;

