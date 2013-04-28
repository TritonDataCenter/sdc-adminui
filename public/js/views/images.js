var Backbone = require('backbone');


var moment = require('moment');
var Images = require('../models/images');
var app = require('../adminui');

var ImageRow = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('../tpl/images-row.hbs'),
    events: {
        'click .image-name': 'onClickImageName'
    },
    onClickImageName: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        app.vent.trigger('showview', 'image', {image: this.model});
    },

    templateHelpers: {
        publish_date: function() {
            var d = moment(this.published_at);
            return d.format("MMM D, YYYY");
        },
        active: function() {
            return this.state === 'active';
        },
        unactivated: function() {
            return this.state === 'unactivated';
        },
        disabled: function() {
            return this.state === 'disabled';
        }
    }
});

var ImagesView = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/images.hbs'),
    url: 'images',
    sidebar: 'images',
    itemView: ImageRow,
    itemViewContainer: 'tbody',
    events: {
        'click .import-image': 'onClickImportImage'
    },
    initialize: function(opts) {
        this.collection = new Images();
        this.collection.fetch({data: {state:'all'}});
        this.listenTo(this.collection, 'sync', this.updateRecordCount, this);
    },
    serializeData: function() {
        return {collection: this.collection};
    },
    updateRecordCount: function() {
        this.$('.record-count').html(this.collection.length);
    },
    onClickImportImage: function() {
        app.vent.trigger('showview', 'image-import');
    }
});

module.exports = ImagesView;

