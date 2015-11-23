/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

/** @jsx React.DOM **/

var React = require('react');
var uuid = require('node-uuid');
var _ = require('underscore');

var NicConfigComponent = require('./nic-config');

var MultipleNicConfigComponent = React.createClass({
    propTypes: {
        nics: React.PropTypes.array,
        networkFilters: React.PropTypes.object,
        expandAntispoofOptions: React.PropTypes.bool,
        onChange: React.PropTypes.func
    },
    getValue: function () {
        var nics = this.state.nics;
        var result = [];
        Object.keys(nics).forEach(function (uuid) {
            var nic = nics[uuid];
            if (Object.keys(nic).length) {
                result.push(nic);
            }
        });
        return result;
    },
    getDefaultProps: function () {
        return {
            expandAntispoofOptions: false,
            networkFilters: {}
        };
    },
    componentWillReceiveProps: function (newProps) {
        var nics = newProps.nics;
        if (Array.isArray(nics) && nics.length) {
            this.setState({nics: this.getNicsArray(nics)});
        }
    },
    getNicsArray: function (nics) {
        var result = {};
        nics.forEach(function (nic) {
            if (Object.keys(nic).length) {
                result[uuid.v4()] = nic;
            }
        });
        return result;
    },
    getInitialState: function () {
        var state = {
            nics: {},
            networks: [],
            networkPools: []
        };
        if (this.props.nics) {
            state.nics = this.getNicsArray(this.props.nics);
        }
        state.networkFilters = this.props.networkFilters;
        state.expandAntispoofOptions = this.props.expandAntispoofOptions;
        state.isIpAvailable = this.props.isIpAvailable || false;
        return state;
    },
    onNicPropertyChange: function (prop, value, nic, nicUuid) {
        var nics = this.state.nics;
        var selectedIps = {};
        nics[nicUuid] = nic;
        var result = {};
        Object.keys(nics).forEach(function (uuid) {
            var currentNic = nics[uuid];
            if (prop === 'primary' && value === true) {
                currentNic.primary = currentNic === nic;
            }
            if (this.state.isIpAvailable && currentNic.ip) {
                selectedIps[currentNic.ip] = true;
            }
            result[uuid] = currentNic;
        }, this) 
        this.setState({nics: result, selectedIps: selectedIps}, function () {
            if (this.props.onChange) {
                this.props.onChange();
            }
        }, this);
    },
    _onChange: function (nics) {
        this.setState({nics: nics}, function () {
            if (this.props.onChange) {
                this.props.onChange();
            }
        }, this);
    },
    addNewNic: function () {
        var nics = this.state.nics;
        nics[uuid.v4()] = {};
        this._onChange(nics);
    },
    removeNic: function (uuid) {
        var nics = this.state.nics;
        delete nics[uuid];
        var nicUuids = Object.keys(nics);
        var isPrimary = nicUuids.some(function (nic) {
            return nics[nic].primary === true;
        });
        if (!isPrimary && nicUuids.length > 0) {
            nics[nicUuids[0]].primary = true;
        }
        this._onChange(nics);
    },
    onLoadNetworks: function (networks, networkPools) {
        var nics = {};
        Object.keys(this.state.nics).forEach(function (uuid) {
            var nic = this.state.nics[uuid];
            var filter = function (network) {
                return network.uuid === nic.network_uuid;
            }
            if (networks.some(filter) || networkPools.some(filter)) {
                nics[uuid] = nic;
            }
        }, this);
        if (!Object.keys(nics).length) {
            nics = this.getNicsArray([{primary: true}]);
        }
        this.setState({
            networks: networks,
            networkPools: networkPools,
            nics: nics
        });
    },
    render: function () {
        var networks = this.state.networks;
        var networkPools = this.state.networkPools;
        var removeNicLink = function (uuid) {
            return (<a className="remove" onClick={this.removeNic.bind(this, uuid)}>
                <i className="fa fa-trash-o"></i> Remove
            </a>);
        }.bind(this);
        return (
            <div className="multiple-nic-config-component">
                {_.map(Object.keys(this.state.nics), function (uuid) {
                    return (
                        <div key={uuid} className="nic-config-component-container">
                            <div className="nic-config-action">
                                {removeNicLink(uuid)}  
                            </div>
                            <div className="nic-config-component">
                                <NicConfigComponent
                                    expandAntispoofOptions={this.state.expandAntispoofOptions}
                                    onPropertyChange={this.onNicPropertyChange}
                                    networkFilters={this.state.networkFilters}
                                    isIpAvailable={this.state.isIpAvailable}
                                    selectedIps={this.state.selectedIps}
                                    onLoadNetworks={this.onLoadNetworks}
                                    uuid={uuid}
                                    networks={networks}
                                    networkPools={networkPools}
                                    nic={this.state.nics[uuid]} />
                            </div>
                        </div>
                    );
                }.bind(this))}
                <a className="attach-network-interface" onClick={this.addNewNic}>Attach Another NIC</a>
            </div>
        );
    }
});


module.exports = MultipleNicConfigComponent;
