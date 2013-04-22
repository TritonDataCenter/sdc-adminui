var Backbone = require('backbone');

var adminui = require('../adminui');

var Networks = require('../models/networks');
var NetworksListItem = require('./networks-list-item');
var NetworksListView = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
        'class': 'unstyled networks-list'
    },
    itemView: NetworksListItem,
    collectionEvents: {
        'error': 'onError'
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
