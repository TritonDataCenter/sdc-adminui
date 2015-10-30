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
var Servers = require('../models/servers');

var NetworksList = React.createFactory(require('../components/pages/networking/networks-list'));
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
    initialize: function () {
        this.servers = new Servers();
        this.servers.params = {nictag: this.model.get('name')};
    },
    showNetwork: function (network) {
        var net = network.model;
        adminui.vent.trigger('showview', 'network', {model: net});
    },
    onShow: function () {
        React.render(NetworksList({params: {nic_tag: this.model.get('name')}}), this.$('.networks-region').get(0));
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
