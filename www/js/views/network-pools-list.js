/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');

var adminui = require('../adminui');
var Networks = require('../models/networks');
var Network = require('../models/network');
var NetworksList = require('./networks-list');

var NetworkPoolsForm = require('./network-pools-form');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/network-pools-list-item.hbs'),

    events: {
        'click .network-pool-header': 'toggleDetails',
        'click .edit': 'editNetworkPool',
        'click .delete': 'onClickDelete'
    },

    onClickDelete: function () {
        var confirmMsg = _.str.sprintf('Confirm delete network pool: %s ?', this.model.get('name'));
        var res = window.confirm(confirmMsg);
        if (res === true) {
            this.deleteNetworkPool();
        }
    },

    editNetworkPool: function (e) {
        e.preventDefault();
        e.stopPropagation();

        this.trigger('edit', this.model);
    },

    deleteNetworkPool: function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        var model = this.model;
        this.model.destroy().done(function () {
            var notifyMsg = _.str.sprintf('Network <strong>%s</strong> deleted successfully.', model.get('name'));
            adminui.vent.trigger('notification', {
                level: 'success',
                message: notifyMsg
            });
        });
    },

    toggleDetails: function () {
        this.$('.networks-list-container').slideToggle(50);
    },

    onRender: function () {
        var el = this.networksList.render().el;
        this.$('.networks-list-container').html(el).hide();
    }
});

var EmptyView = require('./empty');
var NetworkPoolListEmptyView = EmptyView.extend({
    loadingMessage: 'Loading Network Pools...',
    emptyMessage: 'There are no network pools.'
});

module.exports = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    emptyView: NetworkPoolListEmptyView,
    itemView: ItemView,
    itemViewOptions: function () {
        return { emptyViewModel: this.networks };
    },
    attributes: {
        'class': 'list-unstyled network-pools-list'
    },

    initialize: function (options) {
        this.networks = options.networks || new Networks();
    },

    onEditNetworkPool: function (model) {
        adminui.vent.trigger('showview', 'network-pool-form',{
            networkPool: model,
            networks: this.networks
        });
    },

    onBeforeItemAdded: function (itemView) {
        var networks = new Networks();
        _.each(itemView.model.get('networks'), function (networkUuid) {
            var network = new Network({uuid: networkUuid});
            network.fetch().done(function () {
                networks.add(network);
            });
        });
        
        itemView.networksList = new NetworksList({collection: networks});
        this.listenTo(itemView, 'edit', this.onEditNetworkPool);
    }
});
