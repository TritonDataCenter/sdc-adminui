/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
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

var $ = require('jquery');
var React = require('react');
var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');
var Addresses = require('../models/addresses');
var Chosen = require('react-chosen');

var NicConfig = React.createClass({
    propTypes: {
        readonlyNetwork: React.PropTypes.bool,
        expandAntispoofOptions: React.PropTypes.bool,
        nic: React.PropTypes.object,
        onPropertyChange: React.PropTypes.func
    },

    getInitialState: function () {
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
            readonlyNetwork: this.props.readonlyNetwork === true,
            expandAntispoofOptions: this.props.expandAntispoofOptions,
            isIpAvailable: this.props.isIpAvailable || false
        };

        if (typeof(state.expandAntispoofOptions) !== 'boolean') {
            console.warn('[NicConfig] expandAntispoofOptions property is not a boolean, using defaults(true)');
            state.expandAntispoofOptions = true;
        }
        state.loading = true;
        return state;
    },
    componentDidMount: function () {
        var self = this;

        this.networks = new Networks();
        this.networkPools = new NetworkPools();
        this.setState({loading: true});
        $.when(
            this.networks.fetch({ params: this.state.networkFilters }),
            this.networkPools.fetch({ params: this.state.networkFilters })
        ).done(function () {
            self.setState({
                loading: false,
                networks: this.networks.fullCollection.toJSON(),
                networkPools: this.networkPools.toJSON()
            });
        }.bind(this));
    },
    expandAntispoofOptions: function () {
        this.setState({expandAntispoofOptions: true});
    },
    onChange: function (e) {
        var value;
        if (e.target.checked === true || e.target.checked === false) {
            value = e.target.checked;
        } else {
            value = e.target.value;
        }

        var prop = e.target.getAttribute('name');
        var nic = this.state.nic;
        nic[prop] = value;
        if (this.props.isIpAvailable) {
            delete nic.ip;
            var self = this;
            var selectedIps = this.props.selectedIps || {};
            this.setState({loadingIp: true, showIpSelect: true});
            this.addresses = new Addresses({uuid: value});
            this.addresses.fetch().done(function () {
                var freeIpAddresses = self.addresses.toJSON().filter(function (address) {
                    return address.free && !address.reserved && !address.belongs_to_type && !selectedIps[address.ip];
                });
                self.setState({
                    loadingIp: false,
                    addresses: freeIpAddresses
                });
            });
        }
        this.setState({nic: nic});
        this.props.onPropertyChange(prop, value, nic, this);
    },
    onChangeIp: function (e) {
        var value;
        if (e.target.checked === true || e.target.checked === false) {
            value = e.target.checked;
        } else {
            value = e.target.value;
        }
        var nic = this.state.nic;
        nic.ip = value;
        this.setState({nic: nic});
        this.props.onPropertyChange('ip', value, nic, this);
    },
    getValue: function () {
        return this.state.nic;
    },
    renderNetworkSelect: function () {
        var self = this;
        var networks, networkPools;
        if (this.state.readonlyNetwork) {
            networks = this.state.networks.filter(function (n) {
                return n.uuid === self.state.nic.network_uuid;
            });
            networkPools = this.state.networkPools.filter(function (n) {
                return n.uuid === self.state.nic.network_uuid;
            });
        } else {
            networks = this.state.networks;
            networkPools = this.state.networkPools;
        }
        return <Chosen onChange={this.onChange}
                className="form-control"
                name="network_uuid"
                data-placeholder="Select a Network"
                value={this.state.nic.network_uuid}>
            <option value=""></option>
            <optgroup label="Networks">
                {
                    networks.map(function (n) {
                        return (<option key={n.uuid} value={n.uuid}>{n.name} - {n.subnet}</option>);
                    })
                }
            </optgroup>
            <optgroup label="Network Pools">
                {
                    networkPools.map(function (n) {
                        return (<option key={n.uuid} value={n.uuid}>{n.name}</option>);
                    })
                }
            </optgroup>
        </Chosen>;
    },
    render: function () {
        var nic = this.state.nic;
        var expandAntispoofOptions = (nic.allow_dhcp_spoofing || nic.allow_ip_spoofing ||
            nic.allow_mac_spoofing || nic.allow_restricted_traffic || this.state.expandAntispoofOptions);

        return (
            <div className="nic-config form-horizontal">
                <div className="form-group form-group-network row">
                    <label className="control-label col-sm-4">Network</label>
                    <div className="controls col-sm-5">
                        {this.state.loading ? <div className="loading"><i className="fa fa-spinner fa-spin"></i> Retrieving Networks</div> : this.renderNetworkSelect()}
                    </div>
                </div>
                {this.state.isIpAvailable && this.state.showIpSelect &&
                    <div className="form-group form-group-network-ip row">
                        <label className="control-label col-sm-4">IP</label>
                        <div className="controls col-sm-5">
                            {this.state.loadingIp && <div className="loading"><i className="fa fa-spinner fa-spin"></i> Retrieving Network IPs</div>}
                            {!this.state.loadingIp && <div>
                                <Chosen onChange={this.onChangeIp}
                                        className="form-control"
                                        name="ip"
                                        data-placeholder="Select IP address"
                                        value={this.state.nic.ip}>
                                    <option value=""></option>
                                    {
                                        this.state.addresses.map(function (address) {
                                            return (<option key={address.ip} value={address.ip}>{address.ip}</option>);
                                        })
                                    }
                                </Chosen></div>
                            }
                        </div>
                    </div>
                }
                <div className="form-group form-group-primary row">
                    <div className="control-label col-sm-4">
                    &nbsp;
                    </div>
                    <div className="controls col-sm-6">
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
                            <label className="control-label col-sm-4">Anti-Spoofing Options</label>
                            <div className="col-sm-5">
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_dhcp_spoofing} name="allow_dhcp_spoofing" /> Allow DHCP Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_ip_spoofing} name="allow_ip_spoofing" /> Allow IP Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_mac_spoofing} name="allow_mac_spoofing" /> Allow MAC Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={this.onChange} checked={this.state.nic.allow_restricted_traffic} name="allow_restricted_traffic" /> Allow Restricted Traffic</label></div>
                            </div>
                        </div>) : ''
                }
            </div>
        );
    }
});


module.exports = NicConfig;
