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
var IpView = require('./ip');

var NicConfig = React.createClass({
    propTypes: {
        readonlyNetwork: React.PropTypes.bool,
        expandAntispoofOptions: React.PropTypes.bool,
        nic: React.PropTypes.object,
        onPropertyChange: React.PropTypes.func
    },

    getInitialState: function () {
        var nic = this.props.nic || {};

        // normalize UUID to network_uuid
        if (nic.uuid) {
            nic.network_uuid = nic.uuid;
            delete nic.uuid;
        }

        var state = {
            nic: nic,
            networkFilters: this.props.networkFilters || {},
            networks: this.props.networks || [],
            networkPools: this.props.networkPools || [],
            readonlyNetwork: this.props.readonlyNetwork === true,
            expandAntispoofOptions: nic.allow_dhcp_spoofing || nic.allow_ip_spoofing || nic.allow_mac_spoofing || nic.allow_restricted_traffic ||
                (typeof this.props.expandAntispoofOptions === 'boolean' ? this.props.expandAntispoofOptions : true),
            isIpAvailable: this.props.isIpAvailable || false,
            isPrimaryChoosingAvailable: typeof this.props.isPrimaryChoosingAvailable === 'boolean' ? this.props.isPrimaryChoosingAvailable : true
        };

        state.loading = true;
        return state;
    },
    componentDidMount: function () {
        var nic = this.state.nic || {};
        if (this.state.networks.length || this.state.networkPools.length) {
            this.setState({
                loading: false
            });
            this.loadIpAddresses(nic);
        } else {
            this.networks = new Networks();
            this.networkPools = new NetworkPools();
            this.setState({
                loading: true
            });
            $.when(
                this.networks.fetch({
                    params: this.state.networkFilters
                }),
                this.networkPools.fetch({
                    params: this.state.networkFilters
                })
            ).done(function () {
                var networks = this.networks.fullCollection.toJSON();
                var networkPools = this.networkPools.toJSON();
                this.setState({
                    loading: false,
                    networks: networks,
                    networkPools: networkPools
                });
                if (typeof this.props.onLoadNetworks === 'function') {
                    this.props.onLoadNetworks(networks, networkPools);
                }
                this.loadIpAddresses(nic);

            }.bind(this));
        }
    },
    expandAntispoofOptions: function () {
        this.setState({expandAntispoofOptions: true});
    },
    loadIpAddresses: function (nic) {
        nic = nic || this.state.nic;
        if (!nic.network_uuid || !this.state.isIpAvailable) {
            return;
        }
        var network_uuid = nic.network_uuid;
        delete nic.ip;
        var network = this.state.networks.filter(function (network) {
            if (network_uuid === network.uuid) {
                return network;
            }
        })[0];
        var isNetwork = !!network;
        this.setState({showIpSelect: isNetwork});
    },
    onChange: function (e) {
        var value;
        if (typeof e.target.checked === 'boolean') {
            value = e.target.checked;
        } else {
            value = e.target.value;
        }

        var prop = e.target.getAttribute('name');
        var nic = this.state.nic;
        nic[prop] = value;
        if (this.props.isIpAvailable && prop === 'network_uuid') {
            this.loadIpAddresses(nic);
        }
        this.setState({nic: nic});
        this.props.onPropertyChange(prop, value, nic, this.props.uuid);
    },
    onChangeIp: function (value) {
        var nic = this.state.nic;
        if (value) {
            nic.ip = value;
        } else {
            delete nic.ip;
        }
        this.props.onPropertyChange('ip', value, nic, this.props.uuid);
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
        return (
            <Chosen onChange={this.onChange}
                className="form-control"
                name="network_uuid"
                data-placeholder="Select a Network"
                value={this.state.nic.network_uuid}>
                <option value=""></option>
                <optgroup label="Networks">
                    {
                        networks.map(function (nic) {
                            return (<option key={nic.uuid} value={nic.uuid}>{nic.name} - {nic.subnet}</option>);
                        })
                    }
                </optgroup>
                <optgroup label="Network Pools">
                    {
                        networkPools.map(function (nic) {
                            return (<option key={nic.uuid} value={nic.uuid}>{nic.name}</option>);
                        })
                    }
                </optgroup>
            </Chosen>
        );
    },
    render: function () {
        var nic = this.state.nic;
        var handleChange = function (event) {
            this.onChange(event);
        }.bind(this);
        var openAntiSpoofingOptions = function (event) {
            this.expandAntispoofOptions(event)
        }.bind(this);
        var primary = (<div className="form-group form-group-primary row">
            <div className="control-label col-sm-4">
            &nbsp;
            </div>
            <div className="controls col-sm-6">
                <div className="checkbox">
                    <label><input type="checkbox" className="primary" name="primary" onChange={handleChange} checked={nic.primary} /> Make this the primary NIC</label>
                </div>
            </div>
        </div>);
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
                            {<div>
                                <IpView
                                    onChange={this.onChangeIp}
                                    className="form-control"
                                    name="ip"
                                    uuid={this.state.nic.network_uuid} /></div>}
                        </div>
                    </div>
                }
                {!this.state.loading && this.state.isPrimaryChoosingAvailable ? primary : ''}
                {
                    (!this.state.expandAntispoofOptions) ?
                        (<a className="expand-antispoofing-options" onClick={openAntiSpoofingOptions}>Configure Anti-Spoofing</a>) :
                        (<div className="form-group form-group-spoofing row">
                            <label className="control-label col-sm-4">Anti-Spoofing Options</label>
                            <div className="col-sm-5">
                                <div className="checkbox"><label><input type="checkbox" onChange={handleChange} checked={nic.allow_dhcp_spoofing} name="allow_dhcp_spoofing" /> Allow DHCP Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={handleChange} checked={nic.allow_ip_spoofing} name="allow_ip_spoofing" /> Allow IP Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={handleChange} checked={nic.allow_mac_spoofing} name="allow_mac_spoofing" /> Allow MAC Spoofing</label></div>
                                <div className="checkbox"><label><input type="checkbox" onChange={handleChange} checked={nic.allow_restricted_traffic} name="allow_restricted_traffic" /> Allow Restricted Traffic</label></div>
                            </div>
                        </div>)
                }
            </div>
        );
    }
});


module.exports = NicConfig;
