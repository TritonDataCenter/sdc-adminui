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
    getInitialState: function() {
        return { packages: [] };
    },
    componentWillMount: function() {
        var p = new Packages();
        p.fetchActive().done(function(packages) {
            this.setState({packages: packages});
        }.bind(this));
    },
    renderPackages: function() {
        return this.state.packages.map(function(p) {
            return <option value={p.uuid}>{p.name} {p.version}</option>;
        });
    },
    render: function() {
        return <Chosen data-placeholder="Select a Package" name="billing_id">
            <option></option>
            {this.renderPackages()}
        </Chosen>;
    }
});


module.exports = PackageSelect;
