/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM **/

/**
 * Properties
 *
 * nic              Object  object containing nic properties
 * networkFilters   Object  params to pass to network fetch
 * value            String   uuid of initial selected network
 * onPropertyChange         Function fn(property, value, nicObject) callback to value changes
 */
var React = require('react');
var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');
var Chosen = require('react-chosen');

var NicConfig = module.exports = React.createClass({
    propTypes: {
        expandAntispoofOptions: React.PropTypes.bool,
        nic: React.PropTypes.object,
        onPropertyChange: React.PropTypes.func
    },

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
            networkPools: [],
            expandAntispoofOptions: this.props.expandAntispoofOptions
        };

        if (typeof(state.expandAntispoofOptions) !== 'boolean') {
            console.warn('NicConfig expandAntispoofOptions property is not a boolean, using defaults(true)');
            state.expandAntispoofOptions = true;
        }

        console.log('NicConfig initial state', state);
        console.log('NicConfig initial props', this.props);
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
            self.setState({
                networks: this.networks.toJSON(),
                networkPools: this.networkPools.toJSON()
            });
        }.bind(this));
    },
    expandAntispoofOptions: function() {
        this.setState({expandAntispoofOptions: true});
    },
    onChange: function(e) {
        var value;
        if (e.target.checked === true || e.target.checked === false) {
            value = e.target.checked;
        } else {
            value = e.target.value;
        }

        var prop = e.target.getAttribute('name');
        var nic = this.state.nic;
        nic[prop] = value;
        this.setState({nic: nic});
        this.props.onPropertyChange(prop, value, nic, this);
    },
    getValue: function() {
        return this.state.nic;
    },
    render: function() {
        var nic = this.state.nic;
        var expandAntispoofOptions = (nic.allow_dhcp_spoofing || nic.allow_ip_spoofing ||
            nic.allow_mac_spoofing || nic.allow_restricted_traffic || this.state.expandAntispoofOptions);

        /* jshint ignore:begin  */
        return (
            <div className="nic-config form-horizontal">
                <div className="form-group form-group-network row">
                    <label className="control-label col-md-4">Network</label>
                    <div className="controls col-sm-5">
                    <Chosen onChange={this.onChange}
                            className="form-control"
                            name="network_uuid"
                            data-placeholder="Select a Network"
                            value={this.state.nic.network_uuid}>
                        <option value=""></option>
                        <optgroup label="Networks">
                            {
                                this.state.networks.map(function(n) {
                                    return (<option key={n.uuid} value={n.uuid}> {n.name} - {n.subnet} </option>)
                                })
                            }
                        </optgroup>
                        <optgroup label="Network Pools">
                            {
                                this.state.networkPools.map(function(n) {
                                    return (<option key={n.uuid} value={n.uuid}> {n.name}</option>)
                                })
                            }
                        </optgroup>
                    </Chosen>
                    </div>
                </div>

                <div className="form-group form-group-primary row">
                    <div className="control-label col-md-4">
                    &nbsp;
                    </div>
                    <div className="controls col-md-6">
                        <div className="checkbox">
                            <label><input onChange={this.onChange} checked={this.state.nic.primary} type="checkbox" className="primary" name="primary" /> Make this the primary NIC</label>
                        </div>
                    </div>
                </div>

                {
                    (expandAntispoofOptions === false) ?
                    (<a className="expand-antispoofing-options" onClick={this.expandAntispoofOptions}>Configure Anti-spoofing</a>) : ''
                }

                {

                    (expandAntispoofOptions === true) ?
                        (<div className="form-group form-group-spoofing row">
                            <label className="control-label col-md-4">Anti-Spoofing Options</label>
                            <div className="col-sm-5">
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_dhcp_spoofing} name="allow_dhcp_spoofing" /> Allow DHCP Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_ip_spoofing} name="allow_ip_spoofing" /> Allow IP Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_mac_spoofing} name="allow_mac_spoofing" /> Allow MAC Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_restricted_traffic} name="allow_restricted_traffic" /> Allow Restricted Traffic</label></div>
                            </div>
                        </div>) : ''
                }
            </div>
        )
        /* jshint ignore:end */
    }
});
