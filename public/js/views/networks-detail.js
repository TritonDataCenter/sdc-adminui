var Backbone = require('backbone');


var Template = require('../tpl/networks-detail.hbs');

var Addresses = require('../models/addresses');

var AddressesTableRowTemplate = require('../tpl/networks-detail-address-row.hbs');
var AddressesTableRow = Backbone.Marionette.ItemView.extend({
    tagName: "tr",
    template: AddressesTableRowTemplate,
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
    sidebar: "networks",
    initialize: function() {
        this.modelBinder = new Backbone.ModelBinder();
    },
    url: function() {
        return _.str.sprintf('networks/%s', this.model.get('uuid'));
    },
    onRender: function() {
        var addresses = new Addresses({uuid: this.model.get('uuid') });
        var addressesTable = new AddressesTable({
            el: this.$(".addresses tbody"),
            collection: addresses
        });
        addresses.fetch();
        this.modelBinder.bind(this.model, this.el);

        this.notesView = new NotesView({itemUuid: this.model.get('uuid'), el: this.$('.notes')});
        this.notesView.render();
    }
});

module.exports = NetworkDetailView;
