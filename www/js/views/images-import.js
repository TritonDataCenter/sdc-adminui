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
var ImportImageSelector = require('./images-import-list');

var ImageImportView = Backbone.Marionette.Layout.extend({
    id: 'page-image-import',
    sidebar: 'images',
    url: 'images-import',
    template: require('../tpl/images-import.hbs'),
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
        var searchStr = _.str.trim(this.$('input[name=name]').val());
        var params = {
            repository: repo
        };
        if (searchStr.length === 36) {
            params.uuid = searchStr;
        } else {
            params.name = _.str.sprintf('~%s', searchStr);
        }

        var collection = new Images([], { params:  params });
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
