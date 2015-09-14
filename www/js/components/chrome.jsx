/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

"use strict";

/**
 * Chrome
 *
 * This module manages the Layout & Pane for
 * the application
 */

var React = require('react');

var adminui = require('../adminui');

var Topnav = require('./rootnav.jsx');
var Notifications = require('./notifications.jsx');
var JobProgressComponent = require('./job-progress.jsx');
var Localnav = require('./localnav.jsx');
var ServerTime = require('./server-time.jsx');

var Chrome = React.createClass({
    propTypes: {
        state: React.PropTypes.object,
        user: React.PropTypes.object
    },
    displayName: 'Chrome',
    componentWillMount: function () {
        adminui.vent.on('showjob', this.onShowjob, this);
    },
    componentWillUnmount: function () {
        adminui.vent.off('showjob', this.onShowjob);
        React.unmountComponentAtNode(React.findDOMNode($('#content').children().get(0)));
    },
    onShowjob: function (job) {
        this.setState({job: job});
    },
    _handleHideJob: function () {
        this.setState({job: null});
    },
    getInitialState: function () {
        return {};
    },
    getDefaultProps: function () {
        return {};
    },
    _handleSecondnaryMenuSelect: function (item) {
        if (item.view)  {
            adminui.vent.trigger('showview', item.view, {});
            return;
        }

        if (item.component) {
            adminui.vent.trigger('showcomponent', item.component, {});
            return;
        }
    },
    _handleSignout: function () {
        adminui.vent.trigger('signout');
    },
    _handleRootMenuSelect: function (name, type) {
        var evt = type === 'component' ? 'showcomponent' : 'showview';
        adminui.vent.trigger(evt, name, {});
    },
    _handleSelectCurrentUser: function (user) {
        adminui.vent.trigger('showcomponent', 'user', {user: user});
        return false;
    },
    render: function () {
        if (!this.props.state.get('chrome.content')) {
            return (<noscript/>);
        }
        var contentClass = 'chrome ' + (this.props.state.get('chrome.fullwidth') ? 'no-sidebar': 'with-sidebar');
        var localnavContainer = (
            <div id="localnav-container">
                <Localnav handleMenuSelect={this._handleSecondnaryMenuSelect} active={this.props.state.get('localnav.active')} />
                {/* Don't remove this empty tag, CSS-Tricks */}
                <div className="localnav-body"></div>
                <ServerTime />
            </div>
        );

        var contentContainer = (
            <div id="content-container" className={contentClass}>
                <Notifications bus={adminui.vent} />
                <div className="row">
                    <div id="content" className="col-sm-12">
                        {this.props.state.get('chrome.content')}
                    </div>
                </div>
            </div>
        );

        return (
            <div id="adminui">
                {
                    this.state.job ? <JobProgressComponent job={this.state.job} onClose={this._handleHideJob} /> : null
                }
                {
                    this.props.state.get('chrome.rootnav') && <Topnav
                        readonly={!adminui.user.role('operators')}
                        currentDatacenter={this.props.state.get('datacenter')}
                        handleMenuSelect={this._handleRootMenuSelect}
                        handleSignout={this._handleSignout}
                        handleSelectCurrentUser={this._handleSelectCurrentUser}
                        active={this.props.state.get('rootnav.active')}
                        user={adminui.user} />
                }
                <div id="wrapper" className={this.props.state.get('chrome.fullwidth') ? 'no-sidebar': 'with-sidebar'}>
                    {
                        (!this.props.state.get('chrome.fullwidth')) && localnavContainer
                    }
                    {contentContainer}
                </div>
            </div>
        );
    }
});

module.exports = Chrome;
