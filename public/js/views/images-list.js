var Backbone = require('backbone');
var moment = require('moment');
var _ = require('underscore');

var app = require('../adminui');
var Images = require('../models/images');

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


module.exports = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/images-list.hbs'),
    itemView: ImageRow,
    tagName: 'table',
    attributes: {
        'class': 'images-list'
    },
    emptyView: require('./empty').extend({columns: 5}),
    itemViewContainer: 'tbody',
    itemViewOptions: function() {
        return { emptyViewModel: this.collection };
    },
    initialize: function() {
        console.log(this.collection);
        this.listenTo(this.collection, 'sync', this.updateRecordCount, this);
    },
    updateRecordCount: function() {
        this.$('.record-count').html(this.collection.length);
    },
    onShow: function() {
        this.collection.fetch();
    }
});

