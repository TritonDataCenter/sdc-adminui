/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var AlarmsMenu = require('./alarms-menu.jsx');
var Services = require('../models/services');
var cx = require('classnames');

var Rootnav = React.createClass({
    propTypes: {
        currentDatacenter: React.PropTypes.string,
        user: React.PropTypes.object.isRequired,
        active: React.PropTypes.string,

        // handleMenuSelect(view)
        handleMenuSelect: React.PropTypes.func,

        // handleSelectCurrentUser(userUuid)
        handleSelectCurrentUser: React.PropTypes.func
    },
    getInitialState: function () {
        return {
            inMaintenance: false
        };
    },
    classesFor: function (view) {
        var attrs = {};
        view.split(' ').forEach(function (v) {
            attrs[v] = true;
            if (this.props.active === v) {
                attrs.active = true;
            }
        }.bind(this));

        return cx(attrs);
    },

    _clickedMenuItem: function(e) {
        e.preventDefault();
        var view = e.currentTarget.getAttribute('data-view') ;
        var component = e.currentTarget.getAttribute('data-component');
        if (view) {
            this.props.handleMenuSelect(view, 'view');
        } else {
            this.props.handleMenuSelect(component, 'component');
        }
    },

    componentWillMount: function () {
        var self = this;
        var services = new Services();
        services.params = {name: 'cloudapi'};
        services.fetch();
        services.on('sync', function (collection) {
            var result = collection.toJSON();
            var cloudapi = result[0];
            if (cloudapi && cloudapi.metadata.CLOUDAPI_READONLY) {
                self.setState({
                    inMaintenance: true
                });
            }
        });
    },

    componentDidMount: function () {
        this.props.user.fetch().done(function () {
            this.forceUpdate();
        }.bind(this));
    },

    render: function() {
        return (
            <div id="rootnav">
                <div className="navbar navbar-default">
                    <div className="container-fluid">
                        <div className="col-xs-2">
                            <div className="navbar-brand">
                                <h1 className="branding">
                                    <span className="product">SDC</span>
                                    <span className="ops-portal">Operations Portal</span>
                                </h1>
                            </div>
                        </div>
                        <div className="col-xs-7">
                            <ul className="nav navbar-nav main-nav">

                                <li onClick={this._clickedMenuItem} data-component="dashboard" className={this.classesFor('datacenter dashboard')}>
                                    <a href="/dashboard" className="datacenter-name">
                                        <small>Datacenter</small> {this.props.currentDatacenter}
                                        {this.state.inMaintenance ? <span className="navbar-alert"> In Maintenance</span> : ''}
                                    </a>
                                </li>

                                <li className="fishbulb"><a title="Cloud Analytics" href="/fishbulb" target="fishbulb">
                                <i className="fa fa-bar-chart-o fa-fw"></i> Analytics</a></li>

                                <li onClick={this._clickedMenuItem} className={this.classesFor('users')} data-view="users">
                                    <a href="/users"><i className="fa fa-users fa-fw"></i> Users</a>
                                </li>
                            </ul>
                            <ul className="nav navbar-nav main-nav navbar-right">
                                {
                                    this.props.user.get('adminUuid') &&
                                    <li className="alarms">
                                        <AlarmsMenu user={this.props.user.get('adminUuid')} />
                                    </li>
                                }

                                {
                                    !this.props.readonly &&
                                    <li onClick={this._clickedMenuItem} className={this.classesFor('settings')}  data-component="settings">
                                    <a href="/settings"><i className="fa fa-gear fa-fw"></i></a>
                                    </li>
                                }
                            </ul>
                        </div>
                        <div className="acc-controls navbar-text navbar-right">
                            <a className={this.classesFor('current-user')}
                                onClick={this.props.handleSelectCurrentUser.bind(null, this.props.user)}
                                href={'/users/'+this.props.user.get('uuid')}>
                                {
                                 this.props.user.get('emailhash') ?
                                    <div className="user-icon" style={{
                                        'backgroundImage': 'url(https://www.gravatar.com/avatar/'+this.props.user.get('emailhash') + '?d=identicon&s=32)'
                                    }} />
                                    :
                                    <div className="user-icon"></div>
                                }
                                <div className="name">
                                    <span className="cn">{this.props.user.get('cn')}</span>
                                    <span className="login-name">{this.props.user.get('login')}</span>
                                </div>
                            </a>
                            <a onClick={this.props.handleSignout} className="signout"> <i className="fa fa-sign-out fa-fw"></i></a>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
});


module.exports = Rootnav;
