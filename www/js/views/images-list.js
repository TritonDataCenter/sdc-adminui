/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var moment = require('moment');

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
        this.collection.comparator = function(i) {
            return -(new Date(i.get('published_at')).getTime());
        };
        this.listenTo(this.collection, 'request', this.onFetch, this);
        this.listenTo(this.collection, 'sync', this.onSync, this);
    },
    onFetch: function() {
        this.$('caption').hide();
    },
    onSync: function() {
        this.collection.sort();
        this.render();
    },
    onRender: function() {
        this.$('caption').show();
        this.$('.record-count').html(this.collection.length || 0);
    },
    onShow: function() {
        this.$('caption').hide();
        this.collection.fetch();
    },
    appendHtml: function(cv, iv, index) {
        var $container = this.$('tbody');
        if ($container.children().size() <= index) {
            $container.append(iv.el);
        } else {
            $container.children().eq(index).after(iv.el);
        }

    }
});
