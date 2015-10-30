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

var adminui = require('adminui');

var Template = require('../tpl/networks-detail.hbs');

var $ = require('jquery');

var React = require('react');

var Addresses = require('../models/addresses');

var NotesComponent = React.createFactory(require('../components/notes'));
var RoutesList = React.createFactory(require('../components/pages/network/routes-list'));
var AddressesList = React.createFactory(require('../components/pages/network/addresses-list'));
var FabricVlan = require('../models/fabrics-vlan');

var NetworkDetailView = Backbone.Marionette.ItemView.extend({

    template: Template,

    id: 'page-network',

    sidebar: 'networking',

    events: {
        'click .owner-link': 'goToOwner',
        'click .edit-network': 'editNetwork'
    },

    initialize: function (options) {
        var network = this.model.toJSON();
        this.addresses = new Addresses({uuid: network.uuid});
        if (network.fabric) {
            var firstOwner = network.owner_uuids && network.owner_uuids[0];
            var owner_uuid = network.owner_uuid;
            if (owner_uuid && !firstOwner) {
                this.model.set('owner_uuids', [owner_uuid]);
            }
            this.vlan = new FabricVlan({vlan_id: network.vlan_id, owner_uuid: owner_uuid || firstOwner});
        }
    },

    editNetwork: function () {
        adminui.vent.trigger('showview', 'network-form', {
            model: this.model,
            inUse: this.networkIsInUse()
        });
    },

    goToOwner: function (e) {
        e.preventDefault();
        var uuid = $(e.target).attr('data-owner-uuid');
        this.close();
        adminui.vent.trigger('showcomponent', 'user', {uuid: uuid});
    },

    url: function () {
        var network = this.model.toJSON();
        var url = '';
        if (network.fabric) {
            url = 'fabrics/';
            var owner_uuid = network.owner_uuid || network.owner_uuids[0];
            if (owner_uuid !== adminui.user.id) {
                url += owner_uuid + '/';
            }
            url += 'vlan/' + network.vlan_id + '/';
        }
        return url + 'networks/' + network.uuid;
    },

    onClose: function () {
        this.$el.modal('hide');
    },

    networkIsInUse: function () {
        var ips = this.addresses.toJSON();
        for (var i in ips) {
            var ip = ips[i];
            if (ip.belongs_to_type === 'server' || ip.belongs_to_type === 'zone') {
                return true;
            }
        }
        return false;
    },
    onShow: function () {
        this.addresses.fetch();
    },
    serializeData: function () {
        var data = _.clone(this.model.toJSON());
        data.networkIsInUse = this.networkIsInUse();
        data.isNotFabric = !data.fabric;
        data.isFabric = data.fabric;
        return data;
    },

    onRender: function () {
        var self = this;
        var network = this.model.toJSON();
        adminui.vent.trigger('settitle', _.str.sprintf('network: %s %s', network.name));
        React.render(
            NotesComponent({item: network.uuid}),
            this.$('.notes-component-container').get(0)
        );
        var routes = this.model.get('routes');
        if (routes) {
            React.render(
                RoutesList({routes: routes}),
                this.$('.routes-list').get(0));
        }
        React.render(AddressesList({
            collection: this.addresses,
            networkUuid: network.uuid
        }), this.$('.addresses').get(0));

        if (this.vlan) {
            this.vlan.fetch().done(function () {
                var vlan = self.vlan.toJSON();
                $('.vlan-name').html(
                    _.str.sprintf('<a  href="/fabrics/%s/vlan/%s">%s</a>', vlan.owner_uuid, vlan.vlan_id, vlan.name)
                );
            });
        }
    }
});

module.exports = NetworkDetailView;
