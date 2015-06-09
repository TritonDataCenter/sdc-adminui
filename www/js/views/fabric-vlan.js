/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');

var adminui = require('adminui');
var Backbone = require('backbone');
var Networks = require('../models/fabrics-vlan-networks');
var NetworksComponent = React.createFactory(require('../components/fabric-networks'));

module.exports = Backbone.Marionette.Layout.extend({
    template: require('../tpl/fabric-vlan-detail.hbs'),
    attributes: {
        id: 'page-fabric-vlan'
    },
    regions: {
        networksRegion: '.networks-region'
    },
    sidebar: 'networking',
    url: function () {
        var url = '/fabrics/';
        if (this.model.get('owner_uuid') !== adminui.user.id) {
            url += this.model.get('owner_uuid') + '/';
        }
        return url + 'vlan/' + this.model.get('vlan_id');
    },
    initialize: function () {
        this.networks = new Networks();
        this.networks.url = '/api/fabrics/' + this.model.get('owner_uuid') + '/vlan/' + this.model.get('vlan_id') + '/networks';
    },
    onShow: function() {
        var self = this;
        this.networks.fetch().done(function () {
            React.render(
                NetworksComponent({collection: self.networks, data: self.model.toJSON()}),
                self.$('.networks-region').get(0)
            );
        });
    }
});
