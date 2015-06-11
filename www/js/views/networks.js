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

var adminui = require('../adminui');

var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');

var NetworksListView = require('./networks-list');
var NetworkPoolsListView = require('./network-pools-list');
var PaginationView = require('./pagination');

var NetworkPoolsFormView = require('./network-pools-form');
var NetworksCreateView = require('./networks-create');

var TypeaheadUserInput = require('./typeahead-user');

var ___NETWORK_POOL_CREATED = function(networkPool) {
    return _.str.sprintf('Network Pool <strong>%s</strong> created successfully.',
        networkPool.get('name'));
};

var ___NETWORK_CREATED = function(network) {
    return _.str.sprintf('Network <strong>%s</strong> created successfully.', network.get('name'));
};


var NetworksTemplate = require('../tpl/networks.hbs');

var NetworksView = Backbone.Marionette.Layout.extend({
    template: NetworksTemplate,
    url: 'networks',
    sidebar: 'networking',
    events: {
        'click button[name=create-network]': 'showCreateNetworkForm',
        'click button[name=create-network-pool]': 'showCreateNetworkPoolForm',
        'click button.search-by-owner': 'searchByOwner'
    },
    ui: {
        'networksList': '.networks-list',
        'networkPoolsList': '.network-pools-list',
        'paginationNetworks': '.pagination-networks'
    },
    regions: {
        'networksListRegion': '.networks-list',
        'networkPoolsListRegion': '.network-pools-list',
        'paginationNetworksRegion': '.pagination-networks'
    },
    attributes: {
        'id': 'page-networks'
    },

    /**
     * optiosn.networks             NetworksCollection
     * options.networkPools         NetworkPoolsCollection
     */
    initialize: function (options) {
        options = options || {};
        this.networks = options.networks || new Networks(null, {mode: 'client'});
        this.networkPools = options.networkPools || new NetworkPools();

        this.networksList = new NetworksListView({
            showDelete: true,
            collection: this.networks
        });

        this.networkPoolsList = new NetworkPoolsListView({
            networks: this.networks,
            collection: this.networkPools
        });

        this.filterOptions = {};
    },
    searchByOwner: function () {
        var searchInput = this.$('input[name=owner_uuid]');
        var owner = searchInput.val();
        delete this.filterOptions['owner_uuid'];
        if (owner.length === 36) {
            this.filterOptions['owner_uuid'] = owner;
        } else {
            searchInput.typeahead('val', '');
            searchInput.tooltip({
                placement: 'top',
                title: 'Invalid user UUID provided.'
            });
        }
        var params = Object.keys(this.filterOptions).length ? {params: this.filterOptions} : null;
        return this.search(params);
    },
    search: function (params) {
        var self = this;
        return this.networks.fetch(_.extend(params, {}), {reset: true}).done(function () {
            self.networkPools.fetch();
        });
    },
    showCreateNetworkPoolForm: function () {
        var view = new NetworkPoolsFormView({networks: this.networks});
        this.listenTo(view, 'saved', function (networkPool) {
            this.networkPools.add(networkPool);
            view.$el.modal('hide').remove();
            adminui.vent.trigger('notification', {
                level: 'success',
                message: ___NETWORK_POOL_CREATED(networkPool)
            });
        }, this);
        view.show();
    },

    showCreateNetworkForm: function() {
        var view = new NetworksCreateView();
        this.listenTo(view, 'saved', function(network) {
            this.networks.add(network);
            view.$el.modal('hide').remove();
            adminui.vent.trigger('notification', {
                level: 'success',
                message: ___NETWORK_CREATED(network)
            });
        }, this);
        view.show();
    },

    showNetwork: function (view) {
        adminui.vent.trigger('showview', 'network', {model: view.model});
    },

    onRender: function () {
        this.userInput = new TypeaheadUserInput({el: this.$('.search-owner')});
        this.userInput.render();
        this.search().done(function () {});
        this.listenTo(this.networksList, 'itemview:destroy', this.refreshList, this);
    },

    refreshList: function () {
        console.log('networks - refreshList');
        this.networks.fetch({reset: true}).done(function () {
            console.log('networks refreshList - done');
        });
    },

    onShow: function() {
        this.networkPoolsListRegion.show(this.networkPoolsList);
        this.networksListRegion.show(this.networksList);
        this.paginationNetworksRegion.show(new PaginationView({
            collection: this.networks
        }));
        this.delegateEvents();
    }
});

module.exports = NetworksView;
