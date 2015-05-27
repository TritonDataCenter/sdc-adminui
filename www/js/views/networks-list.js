/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');

var adminui = require('../adminui');

var NetworksListItem = require('./networks-list-item');
var NetworksListEmptyView = require('./empty').extend({
    emptyMessage: 'No networks found'
});

var NetworksListView = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
        'class': 'list-unstyled networks-list'
    },
    emptyView: NetworksListEmptyView,
    itemView: NetworksListItem,
    itemViewOptions: function() {
        return {
            'emptyViewModel': this.collection,
            'showDelete': this.showDelete
        };
    },
    collectionEvents: {
        'error': 'onError'
    },
    initialize: function(options) {
        options = options || {};
        this.showDelete = options.showDelete || false;
    },

    onError: function(model, res) {
        adminui.vent.trigger('error', {
            xhr: res,
            context: 'napi / networks'
        });
    }
});

module.exports = NetworksListView;
