var Backbone = require('backbone');
var _ = require('underscore');

var adminui = require('adminui');
var User = require('../models/user');

var Template = require('../tpl/networks-detail.hbs');


var React = require('react');

var Addresses = require('../models/addresses');
var AddressesTableRowTemplate = require('../tpl/networks-detail-address-row.hbs');

var NotesCountComponent = require('../components/notes-count');

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
            adminui.vent.trigger('showview', 'vm', {uuid: uuid });
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
        React.renderComponent(
            new NotesCountComponent({item: item}),
            this.$('.notes-component-container').get(0));
    }
});

var AddressesTable = Backbone.Marionette.CollectionView.extend({
    itemView: AddressesTableRow
});

var NotesView = require('./notes');
var NetworkForm = require('../views/networks-create');

var NetworkDetailView = Backbone.Marionette.ItemView.extend({

    template: Template,

    id: 'page-network',

    sidebar: 'networking',

    events: {
        'click .owner-link': 'goToOwner',
        'click .edit-network': 'editNetwork'
    },

    editNetwork: function() {
        var view = this.networkForm = new NetworkForm({model: this.model});
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
        adminui.vent.trigger('showview', 'user', {uuid: uuid });
    },

    url: function() {
        return _.str.sprintf('networks/%s', this.model.get('uuid'));
    },

    onClose: function() {
        this.$el.modal('hide');
    },

    onRender: function() {
        var addresses = new Addresses({uuid: this.model.get('uuid') });
        var addressesTable = new AddressesTable({
            el: this.$(".addresses tbody"),
            collection: addresses
        });
        addresses.fetch();

        this.notesView = new NotesView({itemUuid: this.model.get('uuid'), el: this.$('.notes')});
        this.notesView.render();
    }
});

module.exports = NetworkDetailView;
