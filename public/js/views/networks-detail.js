define(function(require) {
    var Template = require('text!tpl/networks-detail.html');

    var Addresses = require('models/addresses');

    var AddressesTableRowTemplate = require('text!tpl/networks-detail-address-row.html');
    var AddressesTableRow = Backbone.Marionette.ItemView.extend({
        tagName: "tr",
        template: AddressesTableRowTemplate
    });

    var AddressesTable = Backbone.Marionette.CollectionView.extend({
        itemView: AddressesTableRow
    });

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
        }
    });

    return NetworkDetailView;
});