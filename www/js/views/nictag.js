var adminui = require('adminui');
var Backbone = require('backbone');
var Networks = require('../models/networks');
var NetworksListView = require('./networks-list');
var Servers = require('../models/servers');
var ServersListView = require('./servers-list');

var React = require('react');
var NotesComponent = require('../components/notes');

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
        this.networks = new Networks();
        this.networks.params = {nic_tag: this.model.get('name')};
        this.networksView = new NetworksListView({ collection: this.networks });

        this.listenTo(this.networksView, 'itemview:select', this.showNetwork, this);

        this.servers = new Servers(null, {
            url: '/api/nic_tags/'+this.model.get('name') + '/servers'
        });

        this.serversView = new ServersListView({collection: this.servers });
    },
    showNetwork: function(network) {
        var net = network.model;
        adminui.vent.trigger('showview', 'network', {model: net});
    },

    onShow: function() {
        this.networks.fetch().done(function() {
            this.networksRegion.show(this.networksView);
        }.bind(this));

        this.serversRegion.show(this.serversView);
        // this.servers.fetch().done(function() {
        // }.bind(this));
    },

    onRender: function() {
        React.renderComponent(
            new NotesComponent({ item: this.model.get('uuid')}),
            this.$('.notes-component-container').get(0)
        );
    }


});
