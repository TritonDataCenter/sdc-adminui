/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2019 Joyent, Inc.
 */

/* eslint-disable max-len */
var React = require('react');


var FirewallToggleButton = React.createClass({
    propTypes: {
        initialValue: React.PropTypes.bool,
        onToggle: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        var value = this.props.initialValue || false;
        return {value: value};
    },
    toggleValue: function() {
        var newValue = !this.state.value;
        this.setState({value: newValue});
        if (this.props.onToggle) {
            this.props.onToggle(newValue);
        }
    },
    render: function() {
        var node;
        if (this.state.value === true) {
            node = [
                <button key="on" onClick={this.toggleValue} className="btn btn-sm btn-success">ON</button>,
                <button key="off" onClick={this.toggleValue} className="btn btn-sm btn-default">OFF</button>
            ];
        } else {
            node = [
                <button key="on" onClick={this.toggleValue} className="btn btn-sm btn-default">ON</button>,
                <button key="off" onClick={this.toggleValue} className="btn btn-sm btn-danger">OFF</button>
            ];
        }
        return <div className="firewall-toggle-button-component">{node}</div>;
    }
});


module.exports = FirewallToggleButton;
