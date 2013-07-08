var Backbone = require('backbone');
var _ = require('underscore');

var adminui = require('adminui');
var User = require('../models/user');


var Template = require('../tpl/networks-detail.hbs');

var Addresses = require('../models/addresses');

var AddressesTableRowTemplate = require('../tpl/networks-detail-address-row.hbs');
var AddressesTableRow = Backbone.Marionette.ItemView.extend({
    tagName: "tr",
    template: AddressesTableRowTemplate,
    events: {
        'click .belongs-to a': 'navigateToItem'
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
        (this.$el.parents('.modal').modal('hide'));
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
        }
    }
});

var AddressesTable = Backbone.Marionette.CollectionView.extend({
    itemView: AddressesTableRow
});

var NotesView = require('./notes');

var NetworkDetailView = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'network-details',
    attributes: {
        'class': 'modal'
    },

    events: {
        'click .owner-link': 'goToOwner'
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
