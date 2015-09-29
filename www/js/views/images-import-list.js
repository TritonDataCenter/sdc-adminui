/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var app = require('../adminui');

var ImagesImportListItem = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/images-import-list-item.hbs'),
    tagName: 'tr',
    events: {
        'click .import a': 'startImport'
    },
    startImport: function (e) {
        e.preventDefault();
        var confirm = window.confirm('Confirm import image: ' + this.model.nameWithVersion());
        if (confirm === false) {
            return;
        }
        var self = this;
        this.model.adminImportRemote(function(err, job) {
            if (err) {
                app.vent.trigger('notification', {
                    level: 'error',
                    message: err.message
                });
                return;
            }
            app.vent.trigger('showjob', job );
            self.listenTo(job, 'execution:succeeded', function() {
                app.vent.trigger('showview', 'image', {uuid: job.get('params').image_uuid });
            });
        });
    }
});

var ImagesImport = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/images-import-list.hbs'),
    itemView: ImagesImportListItem,
    tagName: 'table',
    itemViewContainer: 'tbody',
    attributes: {
        'class': 'images-list image-import-selector'
    },
    emptyView: require('./empty').extend({columns: 3}),
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


module.exports = ImagesImport;
