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

var adminui = require('adminui');

var Template = require('../tpl/networks-detail.hbs');

var $ = require('jquery');

var React = require('react');

var Addresses = require('../models/addresses');
var AddressesTableRowTemplate = require('../tpl/networks-detail-address-row.hbs');

var NotesComponent = React.createFactory(require('../components/notes'));

var AddressesTableRow = Backbone.Marionette.ItemView.extend({
    tagName: "tr",

    template: AddressesTableRowTemplate,

    modelEvents: {
        'sync': 'render'
    },

    events: {
        'click .belongs-to a': 'navigateToItem',
        'click .reserve': 'reserve',
        'click .unreserve': 'unreserve'
    },

    reserve: function() {
        this.model.save({reserved: true}, {patch: true});
    },

    unreserve: function() {
        this.model.save({reserved: false}, {patch: true});
    },

    navigateToItem: function(e) {
        if (e) {
            e.preventDefault();
        }

        var uuid = this.model.get('belongs_to_uuid');
        var type = this.model.get('belongs_to_type');
        if (type === 'server') {
            adminui.vent.trigger('showview', 'server', {uuid: uuid });
        }
        if (type === 'zone') {
            adminui.router.showVm(uuid);
        }
    },

    templateHelpers: {
        belongs_to_url: function() {
            var uuid = this.belongs_to_uuid;
            var type = this.belongs_to_type;
            var prefix;
            if (type === 'server') {
                prefix = 'servers';
            } else if (type === 'zone') {
                prefix = 'vms';
            } else {
                return null;
            }
            return _.str.sprintf('/%s/%s', prefix, uuid);
        },
    },
    onRender: function() {
        var networkUuid = this.model.collection.uuid;
        var ip = this.model.get('ip');
        var item = [networkUuid, ip].join('.');
        React.render(
            NotesComponent({item: item}),
            this.$('.notes-component-container').get(0));
    }
});

var AddressesTable = Backbone.Marionette.CollectionView.extend({
    itemView: AddressesTableRow
});

var NetworkForm = require('../views/networks-create');

var NetworkDetailView = Backbone.Marionette.ItemView.extend({

    template: Template,

    id: 'page-network',

    sidebar: 'networking',

    events: {
        'click .owner-link': 'goToOwner',
        'click .edit-network': 'editNetwork'
    },

    initialize: function(options) {
        this.addresses = new Addresses({uuid: this.model.get('uuid') });
        this.listenTo(this.addresses, 'sync', this.render, this);
    },

    editNetwork: function() {
        var view = this.networkForm = new NetworkForm({
            model: this.model,
            inUse: this.networkIsInUse()
        });
        var self = this;
        this.listenTo(view, 'saved', function(network) {
            self.model.fetch().done(this.render);
            view.$el.modal('hide').remove();
            adminui.vent.trigger('notification', {
                level: 'success',
                message: "Updated network successfully."
            });
            view.close();
        });

        this.networkForm.show();
    },

    goToOwner: function(e) {
        e.preventDefault();
        var uuid = $(e.target).attr('data-owner-uuid');
        this.close();
        adminui.vent.trigger('showcomponent', 'user', {uuid: uuid });
    },

    url: function() {
        return _.str.sprintf('networks/%s', this.model.get('uuid'));
    },

    onClose: function() {
        this.$el.modal('hide');
    },

    networkIsInUse: function() {
        var ips = this.addresses.toJSON();
        for (var i in ips) {
            var ip = ips[i];
            if (ip.belongs_to_type === 'server' || ip.belongs_to_type === 'zone') {
                return true;
            }
        }
        return false;
    },
    onShow: function() {
        this.addresses.fetch();
    },
    serializeData: function() {
        var data = _.clone(this.model.toJSON());
        data.networkIsInUse = this.networkIsInUse();
        return data;
    },

    onRender: function() {
        adminui.vent.trigger('settitle', _.str.sprintf('network: %s %s', this.model.get('name')));

        React.render(
            NotesComponent({item: this.model.get('uuid')}),
            this.$('.notes-component-container').get(0)
        );

        this.addressesTable = new AddressesTable({
            el: this.$(".addresses tbody"),
            collection: this.addresses
        });
        this.addressesTable.render();
    }
});

module.exports = NetworkDetailView;
