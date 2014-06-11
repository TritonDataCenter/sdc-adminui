var React = require('react');
var BB = require('../../bb');

var adminui = require('../../../adminui');

var Networks = require('../../../models/networks');
var NetworksList = require('../../../views/networks-list');
var NetworkPools = require('../../../models/network-pools');
var NetworkPoolsList = require('../../../views/network-pools-list');

var UserNetworksList = React.createClass({
    renderNetworkPools: function() {
        var self = this;
        var user = this.props.user;

        self.networkPools = new NetworkPools(null, {params: { provisionable_by: user } });
        self.networkPoolsView = new NetworkPoolsList({
            networks: self.allNetworks,
            collection: self.networkPools
        });

        self.networkPoolsView.on('itemview:select', function(model) {
            adminui.vent.trigger('showview', 'network', {model: model});
        }, self);

        self.networkPools.on('sync', function(collection, resp, options) {
            var filtered = collection.filter(function(m) {
                var ownerUuids = m.get('owner_uuids') || [];
                return (ownerUuids.indexOf(user) !== -1);
            });

            if (filtered.length === 0) {
                return;
            }

            collection.reset(filtered);
        });

        self.networkPools.fetch().done(function() {
            self.forceUpdate();
        });
    },
    componentWillMount: function() {
        var user = this.props.user;
        var self = this;
        this.allNetworks = new Networks();
        this.allNetworks.fetch().done(function() {
            this.renderNetworkPools.apply(this);
        }.bind(this));

        this.networks = new Networks(null, {params: { provisionable_by: this.props.user } });
        this.networksView = new NetworksList({ collection: this.networks });

        this.networks.on('sync', function(collection, resp, options) {
            var filtered = collection.filter(function(m) {
                var ownerUuids = m.get('owner_uuids') || [];
                return (ownerUuids.indexOf(user) !== -1);
            });
            console.log('on sync');
            collection.reset(filtered);
        }, this);

        this.networksView.on('itemview:select', function(view) {
            console.log('on select');
            adminui.vent.trigger('showview', 'network', {model: view.model});
        }, this);

        this.networks.fetch();
    },
    componentDidMount: function() {
        console.log(this.networksView);
    },
    render: function() {

        return <div className="user-networks">
            <h3>Networks</h3>

            { this.networksView && <div className="networks-region"><BB view={this.networksView} /></div> }

            <h3>Network Pools</h3>
            { this.networkPoolsView && <div className="network-pools-region"><BB view={this.networkPoolsView} /></div> }
        </div>;
    },
    componentWillUnmount: function() {
        this.networks.off('sync');
        this.networksView.off('select');
        this.networkPools.off('sync');
        this.networkPoolsView.off('select');
    },
});


module.exports = UserNetworksList;
