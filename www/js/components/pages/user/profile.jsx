/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM */

var React = require('react');
var adminui = require('../../../adminui');
var BackboneMixin = require('../../_backbone-mixin');
var moment = require('moment');
var UserForm = require('../../../views/user-form');
var BB = require('../../bb');
var DATE_FORMAT = 'D MMMM, YYYY HH:mm:ss z';

var UserProfile = React.createClass({
    mixins: [BackboneMixin],
    propTypes: {
        handleModifyUser: React.PropTypes.func.isRequired,
        handleUnlockUser: React.PropTypes.func.isRequired,
        handleToggleTwoFactorAuth: React.PropTypes.func.isRequired
    },
    getInitialState: function () {
        return {};
    },
    getBackboneModels: function () {
        return [this.props.userModel];
    },
    handleModifyUser: function () {
        this.setState({form: true});
    },
    componentWillMount: function () {
        this.userForm = new UserForm({user: this.props.userModel});
    },
    render: function () {
        var user = this.props.userModel.toJSON();
        var twoFactorAuth = this.props.twoFactorAuth;
        var isTopLevelAccount = !user.account;

        var locked = user.pwdaccountlockedtime && (new Date()).getTime() < user.pwdaccountlockedtime;
        var accountLockedTime = moment(new Date(Number(user.pwdaccountlockedtime || 0))).utc().format(DATE_FORMAT);
        var pwdfailuretimes = [];
        if (user.pwdfailuretimes) {
            if (! Array.isArray(user.pwdfailuretimes)) {
                pwdfailuretimes = [user.pwdfailuretimes];
            } else {
                pwdfailuretimes = user.pwdfailuretimes;
            }
        } else {
            pwdfailuretimes = [];
        }
        pwdfailuretimes = pwdfailuretimes.map(function (m) {
            var date = moment(new Date(Number(m)));
            return {
                absolute: date.utc().format(DATE_FORMAT),
                relative: date.fromNow()
            };
        });
        var created = moment.unix(user['created_at'] / 1000).utc().format(DATE_FORMAT);
        var updated = moment.unix(user['updated_at'] / 1000).utc().format(DATE_FORMAT);

        return (
            <div className="row">
                <div className="col-sm-12">
                    <div className="user-profile">
                        {locked ?
                            <div className="alert alert-warning">
                                <h5><strong>User Account Temporarily Locked</strong></h5>
                                <p>
                                    This account is locked until <strong>{accountLockedTime}</strong>
                                    &nbsp;due to too many failed password attempts.
                                </p>
                                <p>
                                <a onClick={this.props.handleUnlockUser} className="btn btn-default">
                                    <i className="fa fa-unlock"></i> Unlock User Now
                                </a>
                                </p>
                            </div>
                        : null }
                        <h3>User Profile
                            {
                                adminui.user.role('operators') ?
                                <div className="actions">
                                    <button onClick={this.props.handleModifyUser} className="edit-user btn btn-sm btn-info">
                                        <i className="fa fa-pencil"></i> Edit User Profile
                                    </button>
                                </div> : null
                            }
                        </h3>
                        {this.userForm && this.state.form && <div className="user-form-region"><BB view={this.userForm} /></div>}
                        <table className="table">
                        <tbody>
                            <tr>
                                <th>Login</th>
                                <td><span className="login">{user.login}</span></td>
                            </tr>
                            <tr>
                                <th>Email</th>
                                <td>
                                    <a href={'mailto:'+user.email}><i class="fa fa-envelope"></i>
                                        <span className="email selectable">{user.email}</span>
                                    </a>
                                </td>
                            </tr>
                            <tr>
                                <th>Company</th>
                                <td><span className="company">{user.company}</span></td>
                            </tr>
                            { user.tenant ?
                            <tr>
                                <th>Tenant</th>
                                <td><span className="tenant">{user.tenant}</span></td>
                            </tr> : null
                            }

                            { user.phone ?
                            <tr>
                                <th>Phone</th>
                                <td><span className="phone">{user.phone}</span></td>
                            </tr> : null }

                            <tr>
                                <th>Created</th>
                                <td><span className="created">{created}</span></td>
                            </tr>

                            <tr>
                                <th>Updated</th>
                                <td><span className="updated">{updated}</span></td>
                            </tr>

                            { isTopLevelAccount ?
                            <tr>
                                <th>Provisioning</th>
                                <td>
                                    {user.approved_for_provisioning === 'true' ?
                                        <span className='provisioning approved'>
                                            <span><i className="fa fa-check"></i> yes</span>
                                        </span>
                                        :
                                        <span className='provisioning disabled'>
                                            <span><i className="fa fa-times"></i> no</span>
                                        </span>
                                    }
                                </td>
                            </tr>
                            : null }

                            { isTopLevelAccount ?
                            <tr>
                                <th>Registered Developer</th>
                                <td>
                                    {user.registered_developer === 'true' ?
                                        <span className='registered-developer yes'>
                                            <span><i className="fa fa-check"></i> yes</span>
                                        </span>
                                        :
                                        <span className='registered-developer no'>
                                            <span><i className="fa fa-times"></i> no</span>
                                        </span>
                                    }
                                </td>
                            </tr>
                            : null }

                            { isTopLevelAccount ?
                            <tr>
                                <th>Use Container Naming Service</th>
                                <td>
                                    {user.triton_cns_enabled === 'true' ?
                                        <span className='triton-cns-enabled yes'>
                                            <span><i className="fa fa-check"></i> yes</span>
                                        </span>
                                        :
                                        <span className='triton-cns-enabled no'>
                                            <span><i className="fa fa-times"></i> no</span>
                                        </span>
                                    }
                                </td>
                            </tr>
                            : null }

                            { isTopLevelAccount ?
                            <tr>
                                <th>Two Factor Auth</th>
                                <td>
                                    <span className={'portal-2fa' + (twoFactorAuth ? ' enabled' : ' disabled') }>
                                    { twoFactorAuth ?
                                        <span><i className="fa fa-check"></i> enabled</span>
                                        :
                                        <span><i className="fa fa-times"></i> disabled</span>
                                        }
                                    </span>
                                    &nbsp;
                                    { twoFactorAuth ?
                                        <a onClick={this.props.handleToggleTwoFactorAuth} className="disable-2fa">
                                            Disable Two Factor Auth
                                        </a> : '' }
                                </td>
                            </tr>
                            : null }

                            { pwdfailuretimes.length ?
                            <tr>
                                <th>Past Failed Authentication Attempts</th>
                                <td>
                                    <ul className="list list-unstyled">
                                    {
                                        pwdfailuretimes.map(function (m) {
                                            return <li className="attempt">{m.absolute} ({m.relative})</li>;
                                        })
                                    }
                                    </ul>
                                </td>
                            </tr>
                            : null }

                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
      }
});

module.exports = UserProfile;
