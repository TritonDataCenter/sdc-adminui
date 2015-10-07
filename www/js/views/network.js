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
var utils = require('../lib/utils');

var Addresses = require('../models/addresses');

var NotesComponent = React.createFactory(require('../components/notes'));
var RoutesList = React.createFactory(require('../components/pages/network/routes-list'));
var AddressesList = React.createFactory(require('../components/pages/network/addresses-list'));

var NetworkDetailView = Backbone.Marionette.ItemView.extend({

    template: Template,

    id: 'page-network',

    sidebar: 'networking',

    events: {
        'click .owner-link': 'goToOwner',
        'click .edit-network': 'editNetwork'
    },

    initialize: function (options) {
        this.addresses = new Addresses({uuid: this.model.get('uuid')});
        this.setOwners();
    },

    setOwners: function () {
        var data = this.model.attributes;
        return utils.setOwnerData(data);
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
            if (network.owner_uuid !== adminui.user.id) {
                url += network.owner_uuid + '/';
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
        adminui.vent.trigger('settitle', _.str.sprintf('network: %s %s', this.model.get('name')));
        var networkUuid = this.model.get('uuid');
        React.render(
            NotesComponent({item: networkUuid}),
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
            networkUuid: networkUuid
        }), this.$('.addresses').get(0));
    }
});

module.exports = NetworkDetailView;
