/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var app = require('../adminui');
var Images = require('../models/images');
var ImagesList = require('./images-list');

var ImportImageSelectorItem = ImagesList.prototype.itemView.extend({
    template: require('../tpl/image-import-select-item.hbs'),
    events: {
        'click .import a': 'startImport'
    },
    startImport: function(e) {
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
        'form submit': 'onQuery',
        'click .search': 'onQuery',
        'click button.import': 'importImage'
    },

    showError: function(message) {
        app.vent.trigger('notification', {
            level: 'error',
            message: message
        });
    },

    onQuery: function(e) {
        e.preventDefault();

        var repo = this.$('.image-source').val();
        var name = this.$('input[name=name]').val();
        var collection = new Images([], { params: {
            name: _.str.sprintf('~%s', name),
            repository: repo
        } });
        var imagesListView = new ImportImageSelector({collection: collection });
        this.imagesList.show(imagesListView);
        this.$('h3').html('Showing images on: ' + repo).show();
    },

    onShow: function() {
        this.$('h3').hide();
        this.$('[name=name]').focus();
    }

});

module.exports = ImageImportView;
