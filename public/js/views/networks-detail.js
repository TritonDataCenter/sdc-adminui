define(function(require) {
    var Template = require('text!tpl/networks-detail.html');

    var Addresses = require('models/addresses');

    var AddressesTableRow = Backbone.Marionette.ItemView.extend({
        template: "<tr><td>{{ip}}</td></tr>"
    });

    var AddressesTable = Backbone.Marionette.CollectionView.extend({
        itemView: AddressesTableRow
    });

    var NetworkDetailView = Backbone.Marionette.ItemView.extend({
        template: Template,
        onRender: function() {
            var addresses = new Addresses({uuid: this.model.get('uuid') });
            var addressesTable = new AddressesTable({
                el: this.$(".addresses tbody"),
                collection: addresses
            });
            addresses.fetch();
        }
    });

    return NetworkDetailView;
});