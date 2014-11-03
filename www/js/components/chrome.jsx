/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
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
var Localnav = require('./localnav.jsx');
var ServerTime = require('./server-time.jsx');

var JobProgressView = require('../views/job-progress');

var Chrome = React.createClass({
    propTypes: {
        state: React.PropTypes.object,
        user: React.PropTypes.object
    },
    displayName: 'Chrome',
    componentWillMount: function() {
        adminui.vent.on('showjob', this.onShowjob, this);
    },
    componentWillUnmount: function() {
        adminui.vent.off('showjob', this.onShowjob);
    },
    onShowjob: function(job) {
        var jobView = new JobProgressView({model: job});
        jobView.show();
    },
    getDefaultProps: function() {
        return {};
    },
    _handleSecondnaryMenuSelect: function(item) {
        if (item.view)  {
            adminui.vent.trigger('showview', item.view, {});
            return;
        }

        if (item.component) {
            adminui.vent.trigger('showcomponent', item.component, {});
            return;
        }
    },
    _handleSignout: function() {
        adminui.vent.trigger('signout');
    },
    _handleRootMenuSelect: function(name, type) {
        var evt;
        if (type === 'component') {
            evt = 'showcomponent';
        } else {
            evt = 'showview';
        }
        adminui.vent.trigger(evt, name, {});
    },
    _handleSelectCurrentUser: function(user) {
        adminui.vent.trigger('showcomponent', 'user', {user: user});
        return false;
    },
    render: function() {
        if (! this.props.state.get('chrome.content')) {
            return <noscript/>;
        }

        var contentClass = 'chrome ' + (this.props.state.get('chrome.fullwidth') ? 'no-sidebar': 'with-sidebar');


        return (
            <div id="adminui">
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
                        (!this.props.state.get('chrome.fullwidth')) &&
                        (<div id="localnav-container">
                            <Localnav handleMenuSelect={this._handleSecondnaryMenuSelect} active={this.props.state.get('localnav.active')} />
                            <ServerTime />
                            </div> )
                    }
                    <div id="content-container" className={contentClass}>
                        <Notifications bus={adminui.vent} />
                        <div className="row">
                            <div id="content" className="col-sm-12">{ this.props.state.get('chrome.content') }</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Chrome;
