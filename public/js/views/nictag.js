var adminui = require('adminui');
var Backbone = require('backbone');
var Networks = require('../models/networks');
var NetworksListView = require('./networks-list');
var Servers = require('../models/servers');
var ServersListView = require('./servers-list');

module.exports = Backbone.Marionette.Layout.extend({
    template: require('../tpl/nictag.hbs'),
    attributes: {
        'id': 'page-nictag'
    },
    sidebar: 'networking',
    url: function() {
        return '/nictags/' + this.model.get('name')     ;
    },
    regions: {
        "networksRegion": '.networks-region',
        "serversRegion": '.servers-region'
    },
    initialize: function() {
        this.networks = new Networks(null, {nic_tag: this.model.get('name')});
        this.networksView = new NetworksListView({ collection: this.networks });

        this.servers = new Servers(null, {
            url: '/_/nic_tags/'+this.model.get('name') + '/servers'
        });

        this.serversView = new ServersListView({collection: this.servers });

        this.listenTo(this.networksView, 'select', this.showNetwork, this);
        this.listenTo(this.networksView, 'select', this.showNetwork, this);
    },
    showNetwork: function(network) {
        adminui.vent.trigger('showview', 'network', {model: network});
    },

    onShow: function() {
        this.networks.fetch().done(function() {
            this.networksRegion.show(this.networksView);
        }.bind(this));

        this.serversRegion.show(this.serversView);
        // this.servers.fetch().done(function() {
        // }.bind(this));
    }


});
