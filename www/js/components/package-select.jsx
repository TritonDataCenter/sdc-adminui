/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Packages = require('../models/packages');
var React = require('react');
var Chosen = require('react-chosen');

var PackageSelect = React.createClass({
    propTypes: {
        onChange: React.PropTypes.func
    },
    getInitialState: function() {
        return { packages: [] };
    },
    _onChange: function(e) {
        var packageUuid = e.target.value;
        var pkg = this.state.packages.filter(function(p) {
            return p.uuid === packageUuid;
        })[0];
        if (this.props.onChange) {
            this.props.onChange(pkg);
        }
    },
    componentWillMount: function() {
        var p = new Packages();
        p.fetchActive().done(function(packages) {
            this.setState({packages: packages});
        }.bind(this));
    },
    renderPackages: function() {
        return this.state.packages.map(function(p) {
            return <option key={p.uuid} value={p.uuid}>{p.name} {p.version}</option>;
        });
    },
    render: function() {
        return <Chosen onChange={this._onChange} data-placeholder="Select a Package" name="billing_id">
            <option></option>
            {this.renderPackages()}
        </Chosen>;
    }
});


module.exports = PackageSelect;
