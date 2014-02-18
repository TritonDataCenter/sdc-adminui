/** @jsx React.DOM **/

/**
 * Properties
 *
 * nic              Object  object containing nic properties
 * networkFilters   Object  params to pass to network fetch
 * value            String   uuid of initial selected network
 * onChange         Function fn(property, value, nicObject) callback to value changes
 */
var React = require('react');
var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');
var Chosen = require('react-chosen');

var NicConfig = module.exports = React.createClass({
    getInitialState: function() {
        if (! this.props.nic) {
            this.props.nic = {};
        }

        // normalize UUID to network_uuid
        if (this.props.nic.uuid) {
            this.props.nic.network_uuid = this.props.nic.uuid;
            delete this.props.nic.uuid;
        }

        var state = {
            nic: this.props.nic,
            networkFilters: this.props.networkFilters || {},
            networks: [],
            networkPools: []
        };

        console.log('NicConfig initial state', state);
        return state;
    },
    componentDidMount: function() {
        var self = this;

        this.networks = new Networks();
        this.networkPools = new NetworkPools();
        $.when(
            this.networks.fetch({ params: this.state.networkFilters }),
            this.networkPools.fetch({ params: this.state.networkFilters })
        ).done(function() {
            self.setState({ networks: this.networks.toJSON() });
            self.setState({ networkPools: this.networkPools.toJSON() });
        }.bind(this));
    },
    onChange: function(e) {
        var value;
        if (e.target.checked === true || e.target.checked === false) {
            value = e.target.checked;
        } else {
            value = e.target.value;
        }

        var prop =  e.target.getAttribute('name');
        var nic = this.state.nic;
        nic[prop] = value;
        this.setState({nic: nic});
        console.log('setState', prop, value);

        if (this.props.onChange) {
            this.props.onChange(prop, value, this.getValue(), this);
        }
    },
    getValue: function() {
        return this.state.nic;
    },
    render: function() {
        /* jshint ignore:begin  */
        return (
            <div className="nic-config">
                <div className="control-group control-group-network">
                    <label className="control-label">Network</label>
                    <div className="controls">
                    <Chosen onChange={this.onChange}
                            name="network_uuid"
                            width="240px"
                            placeholder="Select a Network"
                            value={this.state.nic.network_uuid}>
                        <option value="">Select a Network</option>
                        {
                            this.state.networks.map(function(n) {
                                return (<option key={n.uuid} value={n.uuid}>{n.name} / {n.subnet} </option>)
                            })
                        }
                        {
                            this.state.networkPools.map(function(n) {
                                return (<option key={n.uuid} value={n.uuid}>{n.name}</option>)
                            })
                        }
                    </Chosen>
                    </div>
                </div>

                <div className="control-group control-group-primary">
                    <div className="controls">
                        <label className="checkbox">
                            <input onChange={this.onChange} checked={this.state.nic.primary} type="checkbox" className="primary" name="primary" /> Make this the primary NIC
                        </label>
                    </div>
                </div>

                <div className="control-group control-group-spoofing">
                    <label className="control-label">Spoofing Options</label>
                    <div className="controls">
                        <label className="checkbox"><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_dhcp_spoofing} name="allow_dhcp_spoofing" /> Allow DHCP Spoofing</label>
                        <label className="checkbox"><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_ip_spoofing} name="allow_ip_spoofing" /> Allow IP Spoofing</label>
                        <label className="checkbox"><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_mac_spoofing} name="allow_mac_spoofing" /> Allow MAC Spoofing</label>
                        <label className="checkbox"><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_restricted_traffic} name="allow_restricted_traffic" /> Allow DHCP Spoofing</label>
                        <label className="checkbox"><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_unfiltered_promisc} name="allow_unfiltered_promisc" /> Allow Unfiltered Traffic</label>
                    </div>
                </div>
            </div>
        )
        /* jshint ignore:end */
    }
});
