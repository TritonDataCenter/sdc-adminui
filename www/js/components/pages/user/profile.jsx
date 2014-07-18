/** @jsx React.DOM */

var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');
var moment = require('moment');
var UserProfile = React.createClass({
    mixins: [ BackboneMixin ],
    propTypes: {
        handleModifyUser: React.PropTypes.func.isRequired,
        handleUnlockUser: React.PropTypes.func.isRequired,
        handleToggleTwoFactorAuth: React.PropTypes.func.isRequired
    },
    getBackboneModels: function() {
        return [this.props.userModel];
    },
    render: function() {
        var user = this.props.userModel.toJSON();
        var twoFactorAuth = this.props.twoFactorAuth;
        var isTopLevelAccount = !user.account;
        var pwdfailuretimes = Array.isArray(user.pwdfailuretime) ? user.pwdfailuretime : [user.pwdfailuretime];

        pwdfailuretimes = pwdfailuretimes.map(function(m) {
            var date = moment(new Date(Number(m)));
            return {
                absolute: date.utc().format('D MMMM, YYYY HH:mm:ss z'),
                relative: date.fromNow()
            };
        });

        return (
            <div className="row">
                <div className="col-sm-12">
                    <div className="user-profile">
                        {user.pwdaccountlockedtime &&
                            <div className="alert alert-warning">
                                <h5><strong>User Account Temporarily Locked</strong></h5>
                                <p>
                                    This account is locked until <strong>{moment(new Date(Number(user.pwdaccountlockedtime))).utc().format('D MMMM, YYYY HH:mm:ss z')}</strong> due to too many failed password attempts.
                                </p>
                                <p>
                                    <h5>Attempts:</h5>
                                    <ul className="list">
                                    {
                                        pwdfailuretimes.map(function(m) {
                                            return <li className="attempt">{m.absolute} ({m.relative})</li>;
                                        })
                                    }
                                    </ul>
                                </p>
                                <p>
                                <a onClick={this.props.handleUnlockUser} className="btn btn-default"><i className="fa fa-unlock"></i> Unlock User Now</a>
                                </p>
                            </div>
                        }
                        <h3>User Profile
                            <div className="actions">
                                <button onClick={this.props.handleModifyUser} className="edit-user btn btn-sm btn-info"><i className="fa fa-pencil"></i> Edit User Profile</button>
                            </div>
                        </h3>
                        <table className="table">
                        <tbody>
                            <tr>
                                <th>Login</th>
                                <td><span className="login">{user.login}</span></td>
                            </tr>
                            <tr>
                                <th>Email</th>
                                <td><a href={'mailto:'+user.email}><i class="fa fa-envelope"></i> <span className="email selectable">{user.email}</span></a></td>
                            </tr>
                            <tr>
                                <th>Company</th>
                                <td><span className="company">{user.company}</span></td>
                            </tr>
                            <tr>
                                <th>Phone</th>
                                <td><span className="phone">{user.phone}</span></td>
                            </tr>

                            { isTopLevelAccount &&
                            <tr>
                                <th>Provisioning</th>
                                <td>
                                    <span className={'provisioning ' + (user.approved_for_provisioning === "true" ? 'approved': 'disabled') }>
                                    {
                                        user.approved_for_provisioning === "true" ?
                                        <span><i className="fa fa-check"></i> yes</span> :
                                        <span><i className="fa fa-times"></i> no</span>
                                    }
                                    </span>
                                </td>
                            </tr>
                            }

                            { isTopLevelAccount &&
                            <tr>
                                <th>Registered Developer</th>
                                <td>
                                    <span className={'registered-developer ' + (user.registered_developer === "true" ? 'yes' : 'no')}>
                                        {
                                            user.registered_developer === 'true' ?
                                            <span><i className="fa fa-check"></i> yes</span> : <span><i className="fa fa-times"></i> no</span>
                                        }
                                    </span>
                                </td>
                            </tr>
                            }

                            { isTopLevelAccount &&
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
                                    <a onClick={this.props.handleToggleTwoFactorAuth} className="toggle-2fa">{ twoFactorAuth ? 'Disable' : 'Enable'}</a>
                                </td>
                            </tr>
                            }
                        </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
      }
});

module.exports = UserProfile;
