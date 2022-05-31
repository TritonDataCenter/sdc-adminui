/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 * Copyright 2022 MNX Cloud, Inc.
 */

var React = require('react');
var PropTypes = React.PropTypes;
var Promise = require('promise');
var _ = require('underscore');
var api = require('../../../request');
var adminui = require('../../../adminui');
var User = require('../../../models/user');

var UserForm = require('../../../views/user-form');

var UserSubusers = React.createClass({
    propTypes: {
        'account': PropTypes.string.isRequired
    },

    getInitialState: function () {
        return {
            users: [],
            loading: true
        };
    },
    _load: function () {
        var self = this;
        this._fetchUsers().then(this._fetchUsersRoles).then(function (res) {
            self.setState({loading: false});
        });
    },
    componentWillMount: function () {
        this._load();
    },
    componentDidReceiveProps: function (props) {
        this._load();
    },
    renderUserRow: function (user) {
        /*
        {
            "account":"930896af-bf8c-48d4-885c-6573a94b1853",
            "approved_for_provisioning":"false",
            "cn":"John Doe",
            "company":"Acme Corp",
            "email":"subuser@example.com",
            "givenname":"John",
            "objectclass":"sdcperson",
            "phone":"7788558522",
            "registered_developer":"false",
            "sn":"Doe",
            "userpassword":"35d1074d307f9e46b3f153f6f14fe70123605b8a",
            "uuid":"c53f6bff-856d-49ec-a3db-9d3cfa54675c",
            "pwdchangedtime":"1402651364603",
            "created_at":"1402651364603",
            "updated_at":"1402651364603",
            "pwdendtime":"253406291851364600",
            "alias":"subuser1",
            "login":"930896af-bf8c-48d4-885c-6573a94b1853/subuser1",
            "emailhash":"c4ed941d0afbb504ba8cf17dd54cd1c3"
        }
        */
        var userIconUrl;
        if (user.emailhash) {
            userIconUrl = _.str.sprintf('url(https://www.gravatar.com/avatar/%s?d=identicon&s=48)', user.emailhash);
        } else {
            userIconUrl = '';
        }
        var userIconStyle = {'backgroundImage': userIconUrl};

        return <div key={user.uuid} className="subuser panel">
            <div className="panel-body">
                <div className="subuser-icon-container">
                    <div className="subuser-icon" style={userIconStyle}></div>
                </div>
                <div className="subuser-details">
                    <a onClick={this._handleNavigateToUser.bind(null, user)} className="alias">{user.alias}</a>
                    <div className="cn">{user.cn}</div>
                </div>
                <div className="subuser-email">
                    <a href={'mailto:' + user.email}><i className="fa fa-envelope"></i> {user.email}</a>
                </div>
                <div className="subuser-roles">
                    {
                        user.roles && user.roles.length ?
                        <div className="roles-list">
                            <div className="roles-header">Roles</div>
                            {user.roles.map(function (role) {
                                return <div className="role">{role.name}</div>;
                            })}
                        </div>
                        :
                        <div className="roles-header">No Roles</div>
                    }
                </div>
                {
                    adminui.user.role('operators') ?
                    <div className="subuser-actions">
                        <button onClick={this.deleteUser.bind(null, user)} className="btn-link btn-danger"><i className="fa fa-trash-o"></i></button>
                        <button onClick={this.showEditUser.bind(null, user)} className="btn-link"><i className="fa fa-pencil"></i></button>
                    </div> : null
                }
                </div>
        </div>;
    },

    deleteUser: function (u) {
        var user = new User(u);
        var confirm = window.confirm('Are you sure you want to delete user '+ u.login + ' ?');
        var self = this;
        if (confirm) {
            user.destroy().then(function success() {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('User <strong>%s</strong> deleted successfully', u.login)
                });
                self._load();
            }, function error(xhr) {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: _.str.sprintf('Error deleting user <strong>%s</strong>.  %s', u.login,
                        xhr.responseData.message || xhr.responseText || '')
                });
            });
        }
    },

    showEditUser: function (user) {
        adminui.vent.trigger('showview', 'user-form', {
            user: new User(user),
            account: this.props.account,
            redirect: {
                tab: 'subusers',
                user: this.props.account
            }
        });
    },

    showUserForm: function () {
        adminui.vent.trigger('showview', 'user-form', {
            account: this.props.account,
            redirect: {
                tab: 'subusers',
                user: this.props.account
            }
        });
    },

    render: function () {
        return (<div className="user-subusers">
            <h3>Account Users
            {
                adminui.user.role('operators') ?
                <div className="actions">
                    <button onClick={this.showUserForm} className="btn btn-info"><i className="fa fa-plus" /> Create User</button>
                </div> : null
            }
            </h3>

            {
                this.state.loading ?
                <div className="panel"><div className="panel-body">Retrieving Sub users under this account.</div></div>
                :
                <div className="subusers-list">
                {
                    (this.state.users.length) ? this.state.users.map(this.renderUserRow, this)
                     : <div className="panel"><div className="panel-body">There are no users under this account.</div></div> }
                </div>
            }

        </div>);
    },

    _handleNavigateToUser: function (user) {
        adminui.vent.trigger('showcomponent', 'user', {
            user: user.uuid,
            account: user.account,
            tab: 'profile'
        });
    },

    _fetchUsers: function () {
        var account = this.props.account;
        var self = this;
        return new Promise(function (resolve, reject) {
            api.get('/api/users').query({account: account}).end(function (res) {
                if (res.ok) {
                    self.setState({users: res.body});
                    resolve(res.body);
                } else {
                    reject(res.error);
                }
            }.bind(self));
        });
    },

    _fetchUsersRoles: function () {
        var self = this;
        var users = this.state.users;

        return Promise.all(users.map(function (user) {
            return fetchUserRole(user);
        })).then(function () {
            self.setState({users: users});
        });

        function fetchUserRole(user) {
            return new Promise(function (resolve, reject) {
                var url = _.str.sprintf('/api/users/%s/%s/roles', user.account, user.uuid);
                api.get(url).end(function (res) {
                    if (res.ok) {
                        user.roles = res.body;
                        resolve(true);
                    } else {
                        reject(res.error);
                    }
                }.bind(self));
            });
        }
    }
});

module.exports = UserSubusers;
