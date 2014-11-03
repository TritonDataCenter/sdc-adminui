/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM */

var adminui = require('adminui');

var _ = require('underscore');
var React = require('react');
var UserModel = require('../../models/user');
var api = require('../../request');
var NotesComponent = require('../notes');


var UserProfile = require('./user/profile');
var UserVms = require('./user/vms');
var UserSSHKeys = require('./user/sshkeys');
var UserImages = require('./user/images');
var UserLimits = require('./user/limits/main');
var UserPolicies = require('./user/policies');
var UserSubusers = require('./user/subusers');
var UserNetworks = require('./user/networks');
var UserRoles = require('./user/roles');

var UserForm = require('../../views/user-form');

var PageUser = React.createClass({
    statics: {
        sidebar: 'users',
        url: function(props) {
            var uuid;
            var account;

            if (props.user && typeof(props.user) === 'object') {
                uuid = props.user.get('uuid');
                account = props.user.get('account') || null;
            } else {
                uuid = props.user || props.uuid;
                account = props.account;
            }

            var tab = props.tab || 'profile';
            if (account) {
                return _.str.sprintf('/users/%s/%s/%s', account, uuid, tab);
            } else {
                return _.str.sprintf('/users/%s/%s', uuid, tab);
            }
        }
    },

    getInitialState: function() {
        var user;
        var state = {
            tab: this.props.tab || 'profile'
        };
        if (this.props.user && typeof(this.props.user) === 'object') {
            user = this.props.user;
        } else {
            user = new UserModel({
                uuid: this.props.user || this.props.uuid
            });
            if (this.props.account) {
                user.set({account: this.props.account });
            }
        }


        state.userModel = user;
        // model already contains data
        if (state.userModel.get('cn')) {
            state.loading = false;
        } else {
            state.loading = true;
        }
        return state;
    },

    componentWillReceiveProps: function(props) {
        if (props.tab) {
            this.setState({tab: props.tab});
        }
        if (props.account || props.user) {
            this.state.userModel.set({
                account: props.account,
                uuid: props.user,
                loading: true
            });
            this.fetchUser();
        }
        console.log('componentWillReceiveProps', props);
    },

    componentDidMount: function() {
        this.fetchUser();
        this.fetch2fa();
    },

    fetchUser: function() {
        var req = this.state.userModel.fetch();
        req.fail(function(xhr) {
            this.setState({
                loading: false,
                error: xhr.responseText,
                userModel: this.state.userModel
            });
        }.bind(this));

        req.done(function() {
            this.setState({
                error: null,
                loading: false,
                userModel: this.state.userModel
            });
        }.bind(this));
    },

    fetch2fa: function() {
        var url = _.str.sprintf('/api/users/%s/2fa', this.state.userModel.get('uuid'));
        api.get(url).end(function(res) {
            if (res.ok) {
                this.setState({'2fa': res.body.enabled});
            }
        }.bind(this));
    },

    getCurrentView: function() {
        var view;
        switch (this.state.tab) {
            case 'profile':
                view = <UserProfile
                    handleModifyUser={this.handleProfileModifyUser}
                    handleUnlockUser={this.handleUnlockUser}
                    handleToggleTwoFactorAuth={this.handleProfileToggleTwoFactorAuth}
                    twoFactorAuth={this.state['2fa']} userModel={this.state.userModel} />;
                break;

            case 'vms':
                view = <UserVms uuid={this.state.userModel.get('uuid')} />;
                break;

            case 'limits':
                view = <UserLimits
                    readonly={!adminui.user.role('operators')}
                    user={this.state.userModel.get('uuid') } />;
                break;

            case 'sshkeys':
                view = <UserSSHKeys
                    readonly={!adminui.user.role('operators')}
                    account={this.state.userModel.get('account')}
                    user={this.state.userModel.get('uuid') } />;
                break;

            case 'images':
                view = <UserImages
                    readonly={!adminui.user.role('operators')}
                    user={this.state.userModel.get('uuid')} />;
                break;

            case 'networks':
                view = <UserNetworks
                    readonly={!adminui.user.role('operators')}
                    user={this.state.userModel.get('uuid')} />;
                break;

            case 'subusers':
                view = <UserSubusers
                    readonly={!adminui.user.role('operators')}
                    account={this.state.userModel.get('uuid')} />;
                break;

            case 'policies':
                view = <UserPolicies
                    readonly={!adminui.user.role('operators')}
                    account={this.state.userModel.get('uuid')} />;
                break;

            case 'roles':
                view = <UserRoles
                    readonly={!adminui.user.role('operators')}
                    account={this.state.userModel.get('uuid')} />;
                break;
        }

        return view;
    },

    _changeTab: function(t) {
        this.setState({tab: t});
        if (this.state.userModel.get('account')) {
            adminui.router.changeUrl(_.str.sprintf('/users/%s/%s/%s',
                this.state.userModel.get('account'),
                this.state.userModel.get('uuid'), t ));
        } else {
            adminui.router.changeUrl(_.str.sprintf('/users/%s/%s',
                this.state.userModel.get('uuid'), t ));
        }

    },



    // --- child component handlers

    handleProfileModifyUser: function() {
        var form = new UserForm({user: this.state.userModel});
        form.render();
        form.on('user:saved', function(user) {
            adminui.vent.trigger('notification', {
                level: 'success',
                message: _.str.sprintf('User <strong>%s</strong> saved', user.get('login'))
            });
        }, this);

    },
    handleNavigateToAccount: function() {
        adminui.vent.trigger('showcomponent', 'user', {user: this.state.userModel.get('account')});
    },

    handleUnlockUser: function(e) {
        e.preventDefault();

        var url = '/api/users/'+this.state.userModel.get('uuid') + '/unlock';
        api.post(url).send({}).end(function(res) {
            if (res.ok) {
                adminui.vent.trigger('notification', {
                    message: _.str.sprintf('User unlocked successfully'),
                    level: 'success'
                });
                this.state.userModel.unset('pwdaccountlockedtime');
            }
        }.bind(this));
    },

    handleProfileToggleTwoFactorAuth: function() {
        var self = this;
        var url = '/api/users/'+this.state.userModel.get('uuid') + '/2fa';

        api.get(url).end(function(res) {
            var enabled = !res.body.enabled;

            if (res.ok) {
                api.patch(url).send({enabled: enabled}).end(function() {
                    adminui.vent.trigger('notification', {
                        message: _.str.sprintf('Two factor %s for user', (enabled ? 'enabled': 'disabled')),
                        level: 'success'
                    });
                    self.fetch2fa();
                });
            }
        });
    },


    render: function() {
        if (this.state.loading) {
            return <div id="page-user">
                <div className="loading">
                    <i className="fa fa-circle-o-notch fa-spin" /> Fetching User Profile
                </div>
            </div>;
        }

        if (this.state.error) {
            return <div id="page-user">
                <div className="loading error">
                    <h1><i className="fa fa-warning" /> User could not be retrieved</h1>
                    <p><code>{this.state.error}</code></p>
                </div>
            </div>;
        }



        var user = this.state.userModel.toJSON();
        var currentView = this.getCurrentView();
        var isTopLevelAccount = !user.account;

        adminui.vent.trigger('settitle', _.str.sprintf('user: %s', user.login));

        var userIconUrl;
        if (user.emailhash) {
            userIconUrl = _.str.sprintf('url(https://www.gravatar.com/avatar/%s?d=identicon&s=65)', user.emailhash);
        } else {
            userIconUrl = '';
        }

        var userIconStyle = { 'backgroundImage': userIconUrl };

        return <div id="page-user">
            <div className="page-header">
                <h1>
                    <div className="user-icon" style={userIconStyle}></div>
                    <div className="user-info">
                        <div className="cn">{user.cn}</div>
                        <div className="user-groups">
                        { user.groups && user.groups.map(function(g) {
                            return <div className={"group "+g}>{g}</div>;
                        })}
                        </div>
                        <div className="uuid selectable">{user.uuid}</div>
                    </div>
                </h1>
            </div>

            <div className="actions">
                <div className="notes-component-container"><NotesComponent item={user.uuid} /></div>
            </div>

            {!isTopLevelAccount && <div className="alert alert-info alert-block managed">
            This user is a user managed by another <a onClick={this.handleNavigateToAccount}>account</a>.
            </div> }

            <div className="row">
                <div className="col-sm-2 user-menu">
                    <ul className="nav nav-pills nav-stacked">
                        <li className={this.state.tab === 'profile' ? 'active' : ''}><a onClick={this._changeTab.bind(null, 'profile')}>
                            <i className="fa fa-user fa-fw"></i> Profile</a>
                        </li>

                        { isTopLevelAccount && <li className={this.state.tab === 'subusers' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'subusers')}><i className="fa fa-users fa-fw"></i> Sub Users</a>
                        </li> }

                        { isTopLevelAccount && <li className={this.state.tab === 'roles' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'roles')}><i className="fa fa-users fa-fw"></i> Roles</a>
                        </li> }

                        { isTopLevelAccount && <li className={this.state.tab === 'policies' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'policies')}><i className="fa fa-users fa-fw"></i> Policies</a>
                        </li> }

                        <li className="nav-divider"></li>

                        { isTopLevelAccount && <li className={this.state.tab === 'vms' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'vms')}><i className="fa fa-fw fa-cubes"></i> Virtual Machines</a>
                        </li> }

                        <li className={this.state.tab === 'sshkeys' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'sshkeys')}><i className="fa fa-key fa-fw" /> SSH Keys</a>
                        </li>

                        { isTopLevelAccount && <li className={this.state.tab === 'images' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'images')}><i className="fa fa-image fa-fw" /> Images</a>
                        </li> }

                        { isTopLevelAccount && <li className={this.state.tab === 'limits' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'limits')}><i className="fa fa-fw fa-hand-o-right"></i> Limits</a>
                        </li> }

                        { isTopLevelAccount && <li className={this.state.tab === 'networks' ? 'active' : ''}>
                            <a onClick={this._changeTab.bind(null, 'networks')}><i className="fa fa-fw fa-globe"></i> Networks</a>
                        </li> }
                    </ul>
                </div>

                <div className="col-sm-10 user-content">{currentView}</div>
            </div>
        </div>;
    }
});

module.exports = PageUser;
