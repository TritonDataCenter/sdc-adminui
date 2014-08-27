/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
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

    getInitialState: function() {
        return {
            users: [],
            loading: true
        };
    },
    _load: function() {
        var self = this;
        this._fetchUsers().then(this._fetchUsersRoles).then(function(res) {
            self.setState({loading: false});
        });
    },
    componentWillMount: function() {
        this._load();
    },
    componentDidReceiveProps: function(props) {
        this._load();
    },
    renderUserRow: function(u) {
        /*
        {
            "account":"930896af-bf8c-48d4-885c-6573a94b1853",
            "approved_for_provisioning":"false",
            "cn":"John Doe",
            "company":"Joyent",
            "email":"subuser@joyent.com",
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
        if (u.emailhash) {
            userIconUrl = _.str.sprintf('url(https://www.gravatar.com/avatar/%s?d=identicon&s=48)', u.emailhash);
        } else {
            userIconUrl = '';
        }
        var userIconStyle = { 'background-image': userIconUrl };


        return <div key={u.uuid} className="subuser panel">
            <div className="panel-body">
                <div className="subuser-icon-container">
                    <div className="subuser-icon" style={userIconStyle}></div>
                </div>
                <div className="subuser-details">
                    <a onClick={this._handleNavigateToUser.bind(null, u)} className="alias">{u.alias}</a>
                    <div className="cn">{u.cn}</div>
                </div>
                <div className="subuser-email">
                    <a href={'mailto:' + u.email}><i className="fa fa-envelope"></i> {u.email}</a>
                </div>
                <div className="subuser-roles">
                    {
                        u.roles && u.roles.length ?
                        <div className="roles-list">
                            <div className="roles-header">Roles</div>
                            { u.roles && u.roles.map(function(r) {
                                return <div className="role">{r.name}</div>;
                            }) }
                        </div>
                        :
                        <div className="roles-header">No Roles</div>
                    }
                </div>
                <div className="subuser-actions">
                    <button onClick={this.deleteUser.bind(null, u)} className="btn-link btn-danger"><i className="fa fa-trash-o"></i></button>
                    <button onClick={this.showEditUser.bind(null, u)} className="btn-link"><i className="fa fa-pencil"></i></button>
                </div>
            </div>
        </div>;
    },

    deleteUser: function(u) {
        var user = new User(u);
        var confirm = window.confirm('Are you sure you want to delete user '+ u.login + ' ?');
        var self = this;
        if (confirm) {
            user.destroy().done(function() {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('User <strong>%s</strong> deleted successfully', user.get('login'))
                });
                self._load();
            });
        }
    },

    showEditUser: function(u) {
        var editView = new UserForm({
            user: new User(u),
            account: this.props.account
        });
        editView.render();
        editView.on('user:saved', function(user) {
            adminui.vent.trigger('notification', {
                level: 'success',
                message: _.str.sprintf('User <strong>%s</strong> saved', user.get('login'))
            });
        }, this);
    },

    showUserForm: function() {
        var createView = new UserForm({account: this.props.account});
        createView.render();
        createView.on('user:saved', function(user) {
            this._fetchUsers();

            adminui.vent.trigger('notification', {
                level: 'success',
                message: _.str.sprintf('User <strong>%s</strong> saved under this account.', user.get('login'))
            });
        }, this);
    },
    render: function() {
        return (<div className="user-subusers">
            <h3>Account Users
                <div className="actions">
                    <button onClick={this.showUserForm} className="btn btn-info"><i className="fa fa-plus" /> Create User</button>
                </div>
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


    _handleNavigateToUser: function(u) {
        adminui.vent.trigger('showcomponent', 'user', {
            user: u.uuid,
            account: u.account,
            tab: 'profile'
        });
    },
    _fetchUsers: function() {
        var account = this.props.account;
        var that = this;
        return new Promise(function(resolve, reject) {
            console.log('fetchUsers');
            api.get('/api/users').query({account: account}).end(function(res) {
                if (res.ok) {
                    that.setState({users: res.body});
                    resolve(res.body);
                } else {
                    reject(res.error);
                }
            }.bind(that));
        });
    },

    _fetchUsersRoles: function() {
        var that = this;
        var users = this.state.users;

        return Promise.all(users.map(function(user, index) {
            return fetchUserRole(user, index);
        }));

        function fetchUserRole(user, index) {
            return new Promise(function(resolve, reject) {
                var url = _.str.sprintf('/api/users/%s/%s/roles', user.account, user.uuid);
                api.get(url).end(function(res) {
                    if (res.ok) {
                        that.state.users[index].roles = res.body;
                        that.setState({users: that.state.users});
                        resolve(true);
                    } else {
                        reject(res.error);
                    }
                }.bind(that));
            });
        }
    }
});

module.exports = UserSubusers;
