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
    _handleRootMenuSelect: function(view) {
        adminui.vent.trigger('showview', view, {});
    },
    _handleSelectCurrentUser: function(user) {
        adminui.vent.trigger('showcomponent', 'user', {user: user});
        return false;
    },
    render: function() {
        if (! this.props.state.get('chrome.content')) {
            return <noscript/>;
        }

        var contentClass = 'chrome ' + (this.props.state.get('chrome.fullwidth') ? 'col-sm-12 fullwidth': 'col-sm-10');


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

                <Notifications bus={adminui.vent} />

                <div className="container-fluid">
                    <div className="row">
                        {
                            (!this.props.state.get('chrome.fullwidth')) &&
                                (<div id="localnav-container" className="col-sm-2">
                                    <Localnav handleMenuSelect={this._handleSecondnaryMenuSelect} active={this.props.state.get('localnav.active')} />
                                    <ServerTime />
                                </div> )
                        }

                        <div id="content" className={contentClass}>{ this.props.state.get('chrome.content') }</div>
                    </div>
                </div>
            </div>
        );
    }
});

module.exports = Chrome;
