/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
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
    getValue: function() {
        return this.state.nics;
    },
    getDefaultProps: function() {
        return {
            expandAntispoofOptions: false,
            networkFilters: {},
            nics: []
        };
    },
    getInitialState: function() {
        var state = {};
        state.nics = this.props.nics || [];
        console.log('[MultiNicConfig] initial state', state);
        return state;
    },
    componentWillReceiveProps: function(props) {
        if (props.nics) {
            this.setState({nics: props.nics});
        }
    },
    onNicPropertyChange: function(prop, value, nic, com) {
        console.info('[MultiNicConfig] onNicPropertyChange', prop, value, nic);
        var nics = this.state.nics;
        if (prop === 'primary' && value === true) {
            nics = _.map(nics, function(n) {
                if (n === nic) {
                    n.primary = true;
                } else {
                    n.primary = false;
                }
                return n;
            });
        }
        this.setState({nics: nics});
        if (this.props.onChange) {
            this.props.onChange(nics);
        }
    },
    addNewNic: function() {
        var nics = this.state.nics;
        nics.push({});
        this.setState({nics: nics}, function() {
            this.props.onChange(nics);
        }.bind(this));
    },
    removeNic: function(nic) {
        var nics = _.without(this.state.nics, nic);
        if (nics.length === 1) {
            nics[0].primary = true;
        }
        this.setState({nics: nics}, function() {
            this.props.onChange(nics);
        }.bind(this));
    },
    render: function() {
        console.log('[MultiNicConfig] props', this.props);
        console.log('[MultiNicConfig] state', this.state);
        var nodes = _.map(this.state.nics, function(nic) {
            return <div className="nic-config-component-container">
                <div className="nic-config-action">
                    <a className="remove" onClick={this.removeNic.bind(this, nic)}>
                        <i className="fa fa-trash-o"></i> Remove
                    </a>
                </div>
                <div className="nic-config-component">
                    <NicConfigComponent
                        expandAntispoofOptions={this.props.expandAntispoofOptions}
                        onPropertyChange={this.onNicPropertyChange}
                        networkFilters={this.props.networkFilters}
                        nic={nic} />
                </div>
            </div>;
        }, this);

        return <div className="multiple-nic-config-component">
            {nodes}
            <a className="attach-network-interface" onClick={this.addNewNic}>Attach Another NIC</a>
        </div>;
    }
});


module.exports = MultipleNicConfigComponent;
