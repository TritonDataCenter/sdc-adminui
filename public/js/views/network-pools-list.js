var Backbone = require('backbone');
var _ = require('underscore');

var adminui = require('../adminui');
var Networks = require('../models/networks');
var NetworksList = require('./views/networks-list');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/network-pools-list-item.hbs'),

    events: {
        'click .network-pool-header': 'toggleDetails',
        'click .delete': 'onClickDelete'
    },

    onClickDelete: function() {
        var confirmMsg = _.str.sprintf('Confirm delete network pool: %s ?', this.model.get('name'));
        var res = window.confirm(confirmMsg);
        if (res === true) {
            this.deleteNetworkPool();
        }
    },

    deleteNetworkPool: function() {
        var model = this.model;
        this.model.destroy().done(function() {
            var notifyMsg = _.str.sprintf('Network <strong>%s</strong> deleted successfully.', model.get('name'));
            adminui.vent.trigger('notification', {
                level: 'success',
                message: notifyMsg
            });
        });
    },

    toggleDetails: function() {
        this.$('.networks-list-container').toggle('slide', null, 100);
    },

    onRender: function() {
        var el = this.networksList.render().el;
        this.$('.networks-list-container').html(el).hide();
    }
});

var EmptyView = require('./empty');
var NetworkPoolListEmptyView = EmptyView.extend({
    tagName: 'p',
    loadingMessage: 'Loading Network Pools...',
    emptyMessage: 'There are no network pools.'
});

module.exports = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    emptyView: NetworkPoolListEmptyView,
    itemView: ItemView,
    itemViewOptions: function() {
        return { emptyViewModel: this.networks };
    },
    attributes: {
        'class': 'unstyled network-pools-list'
    },
    initialize: function(options) {
        this.networks = options.networks;
    },

    onSelect: function(network) {
        this.trigger('select', network);
    },

    onBeforeItemAdded: function(itemView) {
        var networks = _.map(itemView.model.get('networks'), function(networkUuid) {
            return this.networks.get(networkUuid).toJSON();
        }, this);
        itemView.networksList = new NetworksList({collection: new Networks(networks)});
        this.listenTo(itemView.networksList, 'select', this.onSelect);
    }
});
