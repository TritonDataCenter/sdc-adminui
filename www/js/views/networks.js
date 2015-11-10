/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var React = require('react');
var _ = require('underscore');
var adminui = require('../adminui');

var NetworksList = React.createFactory(require('../components/pages/networking/networks-list'));
var NetworkPoolsListView = React.createFactory(require('../components/pages/networking/network-pool-list'));
var TypeaheadUserInput = require('./typeahead-user');
var NetworksTemplate = require('../tpl/networks.hbs');

var NetworksView = Backbone.Marionette.Layout.extend({
    template: NetworksTemplate,
    url: 'networks',
    sidebar: 'networking',
    events: {
        'click button[name=create-network]': 'showCreateNetworkForm',
        'click button[name=create-network-pool]': 'showCreateNetworkPoolForm',
        'click button.search-networks': 'searchByParams'
    },
    ui: {
        'networksList': '.networks-list',
        'networkPoolsList': '.network-pools-list',
        'paginationNetworks': '.pagination-networks'
    },
    regions: {
        'networksListRegion': '.networks-list',
        'networkPoolsListRegion': '.network-pools-list'
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
        this.filterOptions = options.query || {};
    },
    showCreateNetworkPoolForm: function () {
        adminui.vent.trigger('showview', 'network-pool-form', {networks: this.networks});
    },
    showCreateNetworkForm: function () {
        adminui.vent.trigger('showview', 'network-form');
    },
    onRender: function () {
        var self = this;
        React.render(
            NetworksList({params: _.extend({fabric: false}, this.filterOptions), showActions: true, filterTypes: ['owner_uuid', 'nic_tag', 'uuid'], pagination: true}),
            self.$('.networks-list').get(0)
        );
        React.render(
            NetworkPoolsListView(),
            self.$('.network-pools-list').get(0)
        );
    },

    onShow: function () {
        this.delegateEvents();
    }
});

module.exports = NetworksView;