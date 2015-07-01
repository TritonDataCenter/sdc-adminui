/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM */

var adminui = require('../adminui');
var React = require('react');
var cx = require('classnames');

var SecondaryNav = React.createClass({
    displayName: 'Localnav',
    propTypes: {
        handleMenuSelect: React.PropTypes.func.isRequired,
        active: React.PropTypes.string
    },
    _clickedMenuItem: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        e.preventDefault();
        var page = e.currentTarget.getAttribute('data-view');
        if (page) {
            this.props.handleMenuSelect({view: page});
            return;
        }
        var component = e.currentTarget.getAttribute('data-component');
        if (component) {
            this.props.handleMenuSelect({component: component});
            return;
        }
    },
    _classesFor: function(v) {
        return cx({
            active: (this.props.active === v)
        });
    },
    mantaNav: function() {
        if (adminui.state.get('manta')) {
            return [
                <li className="nav-header">Storage (Manta)</li>,
                <li className={this._classesFor('manta-agents')} onClick={this._clickedMenuItem} data-component="manta/agents"><a href="/manta/agents">Agents</a></li>
            ];
        }
    },
    render: function() {
        return (<div id="localnav">
            <ul className="nav">
                <li className="nav-header">Compute</li>
                <li className={this._classesFor('dashboard')} onClick={this._clickedMenuItem} data-component="dashboard"><a href="/dashboard"><i className="fa fa-home"></i> Dashboard</a></li>
                <li className={this._classesFor('vms')} onClick={this._clickedMenuItem} data-component="vms"><a href="/vms"><i className="fa fa-cubes"></i> Containers</a></li>
                <li className={this._classesFor('servers')} onClick={this._clickedMenuItem} data-view="servers"><a href="/servers"><i className="fa fa-list"></i> Servers</a></li>
                <li className={this._classesFor('images')} onClick={this._clickedMenuItem} data-component="images"><a href="/images"><i className="fa fa-photo"></i> Images</a></li>
                <li className={this._classesFor('packages')} onClick={this._clickedMenuItem} data-view="packages"><a href="/packages"><i className="fa fa-codepen"></i> Packages</a></li>

                { this.mantaNav() }

                <li className="nav-header">Infrastructure</li>
                <li className={this._classesFor('networking')} onClick={this._clickedMenuItem} data-view="networking"><a href="/networks">Networking</a></li>
                <li className={this._classesFor('jobs')} onClick={this._clickedMenuItem} data-view="jobs"><a href="/jobs">Jobs</a></li>
                <li className={this._classesFor('services')} onClick={this._clickedMenuItem} data-view="services"><a href="/services">Services</a></li>
            </ul>
        </div>);
    }
});

module.exports = SecondaryNav;
