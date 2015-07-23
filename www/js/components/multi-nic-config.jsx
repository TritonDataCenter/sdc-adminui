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
        return this.state.nics;
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
            networkPools: []
        };
        state.nics = this.props.nics || [];
        state.networkFilters = this.props.networkFilters;
        state.expandAntispoofOptions = this.props.expandAntispoofOptions;
        state.isIpAvailable = this.props.isIpAvailable || false;
        return state;
    },
    componentWillReceiveProps: function (props) {
        if (props.nics) {
            this.setState({nics: props.nics});
        }
    },
    onNicPropertyChange: function (prop, value, nic, com) {
        var nics = this.state.nics;
        var self = this;
        var selectedIps = {};
        nics[com.props.index] = nic;

        nics = _.map(nics, function (n) {
            if (prop === 'primary' && value === true) {
                n.primary = n === nic;
            }
            if (self.state.isIpAvailable && n.ip) {
                selectedIps[n.ip] = true;
            }
            return n;
        });

        this.setState({nics: nics, selectedIps: selectedIps}, function () {
            if (this.props.onChange) {
                this.props.onChange(nics);
            }
        }.bind(this));
    },
    addNewNic: function () {
        var nics = this.state.nics;
        nics.push({});
        this.setState({nics: nics}, function () {
            this.props.onChange(nics);
        }.bind(this));
    },
    removeNic: function (index) {
        var nics = this.state.nics.splice(index, 1);
        if (nics.length === 1) {
            nics[0].primary = true;
        }
        this.setState({nics: nics}, function () {
            this.props.onChange(nics);
        }.bind(this));
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
        var nodes = _.map(this.state.nics, function (nic, i) {
            return <div className="nic-config-component-container">
                <div className="nic-config-action">
                    <a className="remove" onClick={this.removeNic.bind(this, i)}>
                        <i className="fa fa-trash-o"></i> Remove
                    </a>
                </div>
                <div className="nic-config-component">
                    <NicConfigComponent
                        expandAntispoofOptions={this.state.expandAntispoofOptions}
                        onPropertyChange={this.onNicPropertyChange}
                        networkFilters={this.state.networkFilters}
                        isIpAvailable={this.state.isIpAvailable}
                        selectedIps={this.state.selectedIps}
                        index={i}
                        nic={nic}
                        networks={networks}
                        networkPools={networkPools}
                        onLoadNetworks={this.onLoadNetworks} />
                </div>
            </div>;
        }, this);

        return (<div className="multiple-nic-config-component">
            {nodes}
            <a className="attach-network-interface" onClick={this.addNewNic}>Attach Another NIC</a>
        </div>);
    }
});


module.exports = MultipleNicConfigComponent;
