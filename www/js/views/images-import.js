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
        'click button.import': 'importImage',
        'click button.load-more': 'loadMore'
    },

    showError: function(message) {
        app.vent.trigger('notification', {
            level: 'error',
            message: message
        });
    },

    checkImgapiExternalNic: function() {
        var self = this;
        Images.hasExternalNic(function(err, stat) {
            if (stat && stat.externalNic === false) {
                self.$('a.imgapi-vm-btn').attr('href', '/vms/'+stat.imgapiUuid).click(function(e) {
                    e.preventDefault();
                    app.router.showVm(stat.imgapiUuid);
                });
                self.$('.no-external-nic-alert').show();
            } else {
                self.$('.no-external-nic-alert').hide();
            }
        });
    },

    loadMore: function() {
        this.imagesListView.collection.state.pageSize += 25;
        this.$('button.load-more').hide();
        this.imagesListView.collection.fetch();
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
        collection.state.pageSize = 25;
        this.imagesListView = new ImportImageSelector({collection: collection});
        this.imagesList.show(this.imagesListView);
        this.$('h3').html('Showing images on: ' + repo).show();
        this.listenTo(this.imagesListView.collection, 'sync', this.onSync);
    },

    onSync: function(collection) {
        if (collection.fullCollection.length > collection.state.pageSize) {
            this.$('button.load-more').show();
        }
    },

    onShow: function() {
        this.$('h3').hide();
        this.$('button.load-more').hide();
        this.$('[name=name]').focus();
        this.checkImgapiExternalNic();
    }

});

module.exports = ImageImportView;
