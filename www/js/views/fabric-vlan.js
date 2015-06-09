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
var EditableField = React.createFactory(require('../components/editable-field'));

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
    vlanUpdate: function (params, callback) {
        this.model.save(params).done(callback).fail(callback);
    },
    vlanUpdateName: function (value, params, callback) {
        params.name = value;
        this.vlanUpdate(params, callback);
    },
    vlanUpdateDescription: function (value, params, callback) {
        if (value) {
            params.description = value;
        } else {
            delete params.description;
        }
        this.vlanUpdate(params, callback);
    },
    onShow: function() {
        var self = this;
        var vlan = this.model.toJSON();
        this.networks.fetch().done(function () {
            React.render(
                NetworksComponent({collection: self.networks, data: self.model.toJSON()}),
                self.$('.networks-region').get(0)
            );
        });
        React.render(
            EditableField({
                value: vlan.name,
                title: 'Name',
                onSave: this.vlanUpdateName.bind(self),
                params: vlan
            }), this.$('.name-field').get(0)
        );
        React.render(
            EditableField({
                value: vlan.description || '',
                title: 'Description',
                onSave: this.vlanUpdateDescription.bind(self),
                params: vlan
            }), this.$('.description-field').get(0)
        );
    }
});
