define(function(require) {
    var Networks = require('models/networks');
    var Network = require('models/network');
    var NetworkCreateView = require('views/networks-create');

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
        url: 'networks',
        events: {
            'click button[name=create]': 'showCreateNetworkForm'
        },
        attributes: {
            "id":"page-networks"
        },
        regions: {
            "list": ".list",
            "details": ".details"
        },

        initialize: function(options) {
            this.listView = new NetworksListView();
            options = options || {};
            if (options.uuid) {
                this.network = new Network({uuid: options.uuid});
                this.network.fetch();
            }
        },

        showCreateNetworkForm: function() {
            var view = new NetworkCreateView();
            this.bindTo(view, 'saved', function(n) {
                console.log(n);
                this.listView.collection.add(n);
                this.showNetwork(n);
            }, this);
            this.details.show(view);
        },

        showNetwork: function(network) {
            var view = new NetworksDetailView({model: network});
            this.details.show(view);
        },

        onRender: function() {
            this.bindTo(this.listView, 'select', this.showNetwork, this);
            this.bindTo(this.details, 'show', function(view) {
                adminui.router.applyUrl(view);
            });

            this.list.show(this.listView);

            if (this.network) {
                this.showNetwork(this.network);
            }
        }
    });

    var NetworksListTemplate = require('text!tpl/networks-list.html');
    var NetworksListView = Backbone.Marionette.CompositeView.extend({
        tagName: 'ul',
        attributes: { 'class': 'nav' },
        itemViewContainer: 'ul.items',
        template: NetworksListTemplate,
        itemView: NetworksListItem,

        initialize: function(options) {
            this.collection = new Networks();
            this.collection.fetch();
            
            this.bindTo(this.collection, 'error', this.onError, this);
        },

        onError: function(model, res) {
            adminui.vent.trigger('error', {
                xhr: res,
                context: 'napi / networks'
            });
        },

        onItemAdded: function(itemView) {
            this.bindTo(itemView, 'select', this.onSelect, this);
        },

        onSelect: function(model)  {
            this.trigger('select', model);
        },
        
        onRender: function() {
        }
    });

    return NetworksView;
});