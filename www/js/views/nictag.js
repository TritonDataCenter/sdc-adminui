/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');

var adminui = require('adminui');
var Backbone = require('backbone');
var Networks = require('../models/networks');
var NetworksListView = require('./networks-list');
var Servers = require('../models/servers');

var ServersListComponent = React.createFactory(require('../components/servers-list'));
var NotesComponent = React.createFactory(require('../components/notes'));
var EditableField = React.createFactory(require('../components/editable-field'));

var api = require('../request');

module.exports = Backbone.Marionette.Layout.extend({
    template: require('../tpl/nictag.hbs'),
    attributes: {
        'id': 'page-nictag'
    },
    sidebar: 'networking',
    url: function() {
        return '/nictags/' + this.model.get('name');
    },
    regions: {
        "networksRegion": '.networks-region'
    },
    initialize: function () {
        this.networks = new Networks();
        this.networks.params = {nic_tag: this.model.get('name')};
        this.networksView = new NetworksListView({collection: this.networks});

        this.listenTo(this.networksView, 'itemview:select', this.showNetwork, this);

        this.servers = new Servers();
        this.servers.params = {nictag: this.model.get('name')};
        this.serversView = new ServersListComponent({collection: this.servers});
    },
    showNetwork: function (network) {
        var net = network.model;
        adminui.vent.trigger('showview', 'network', {model: net});
    },
    onShow: function () {
        this.networks.fetch().done(function () {
            this.networksRegion.show(this.networksView);
        }.bind(this));

        React.render(ServersListComponent({collection: this.servers}), this.$('.servers-region').get(0));
    },
    mtuUpdate: function (value, params, callback) {
        params.mtu = /^[0-9]+$/.test(value) ? parseInt(value, 10) : value;
        api.put('/api/nic_tags').send(params).end(callback);
    },
    onRender: function () {
        React.render(
            NotesComponent({ item: this.model.get('uuid')}),
            this.$('.notes-component-container').get(0)
        );
        React.render(
            EditableField({
                value: this.model.get('mtu'), 
                title: 'MTU',
                showTitle: true,
                onSave: this.mtuUpdate, 
                params: {name: this.model.get('name')}
            }), this.$('.mtu-field').get(0)
        );
    }
});
