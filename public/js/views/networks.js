define(function(require) {
    var Networks = require('models/networks');
    var NetworksTemplate = require('text!tpl/networks.html');
    var NetworksListItemTemplate = require('text!tpl/networks-list-item.html');

    var adminui = require('adminui');

    var NetworksListItem = Backbone.Marionette.ItemView.extend({
        template: NetworksListItemTemplate,
        tagName: 'li',
        events: {
            'click': 'select'
        },

        highlightIfThis: function(model) {
            if (model == this.model) {
                this.highlight();
            }
        },
        unhighlight: function() {
            this.$el.siblings().removeClass('active');
        },

        highlight: function() {
            this.$el.siblings().removeClass('active');
            this.$el.addClass('active');
        },

        select: function() {
            this.highlight();
            this.trigger('select', this.model);
        }
    });


    var NetworksDetailView = require('views/networks-detail');
    var NetworksView = Backbone.Marionette.Layout.extend({
        template: NetworksTemplate,
        name: "networks",
        attributes: {
            "id":"page-networks"
        },
        regions: {
            "list": ".list",
            "details": ".details"
        },
        initialize: function() {
            this.listView = new NetworksListView();
        },

        onSelectNetwork: function(network) {
            this.details.show(new NetworksDetailView({model: network}));
        },

        onRender: function() {
            this.bindTo(this.listView, 'select', this.onSelectNetwork, this);
            this.list.show(this.listView);
        }
    });

    var NetworksListTemplate = require('text!tpl/networks-list.html');
    var NetworksListView = Backbone.Marionette.CompositeView.extend({
        tagName: 'ul',
        attributes: { 'class': 'nav' },
        itemViewContainer: 'ul',
        template: NetworksListTemplate,
        itemView: NetworksListItem,

        initialize: function(options) {
            this.collection = new Networks();
            this.collection.fetch();
        },

        onItemAdded: function(itemView) {
            this.bindTo(itemView, 'select', this.onSelect, this);
        },

        onSelect: function(model)  {
            this.trigger('select', model);
        }
    });

    return NetworksView;
});