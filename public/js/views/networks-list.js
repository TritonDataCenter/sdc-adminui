var Backbone = require('backbone');

var adminui = require('../adminui');

var Networks = require('../models/networks');
var NetworksListItem = require('./networks-list-item');
var NetworksListEmptyView = require('./empty').extend({
    emptyMessage: 'No networks found'
});

var NetworksListView = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
        'class': 'unstyled networks-list'
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
    },

    onBeforeItemAdded: function(itemView) {
        this.listenTo(itemView, 'select', this.onSelect, this);
    },

    onSelect: function(model)  {
        this.trigger('select', model);
    }
});

module.exports = NetworksListView;
