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
        return Object.keys(nics).map(function (uuid) {
            return nics[uuid];
        });
    },
    getDefaultProps: function () {
        return {
            expandAntispoofOptions: false,
            networkFilters: {},
            nics: []
        };
    },
    getInitialState: function () {
        var state = {
            networks: [],
            networkPools: [],
            nics: {}
        };
        this.props.nics.forEach(function (nic) {
            state.nics[uuid.v4()] = nic;
        });
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
    addNewNic: function () {
        var nics = this.state.nics;
        nics[uuid.v4()] = {};
        this.setState({nics: nics}, function () {
            this.props.onChange();
        }, this);
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
        this.setState({nics: nics}, function () {
            this.props.onChange();
        }, this);
    },
    onLoadNetworks: function (networks, networkPools) {
        this.setState({
            networks: networks,
            networkPools: networkPools
        });
    },
    render: function () {
        var networks = this.state.networks;
        var networkPools = this.state.networkPools;
        var removeNicLink = function (uuid) {
            return (
                <a className="remove" onClick={this.removeNic.bind(this, uuid)}>
                    <i className="fa fa-trash-o"></i> Remove
                </a>
            )
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
