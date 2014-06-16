/** @jsx React.DOM */

var React = require('react');

var UserProfile = React.createClass({
    propTypes: {
        handleModifyUser: React.PropTypes.func.isRequired,
        handleToggleTwoFactorAuth: React.PropTypes.func.isRequired
    },
    render: function() {
        var user = this.props.userModel.toJSON();
        var twoFactorAuth = this.props.twoFactorAuth;
        var isTopLevelAccount = !user.account;


        return (
            <div className="row">
                <div className="col-sm-12">
                    <div className="user-profile">
                        <h3>User Profile
                            <div className="actions">
                                <button onClick={this.props.handleModifyUser} className="edit-user btn btn-sm btn-info"><i className="fa fa-pencil"></i> Modify User</button>
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
                                <td><span className="email selectable">{user.email}</span></td>
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
                                    <th>Groups</th>
                                    <td><span className="groups">{user.groups && user.groups.join(' ')}</span></td>
                                </tr>
                            }

                            { isTopLevelAccount &&
                            <tr>
                                <th>Provisioning</th>
                                <td>
                                    <span className={'provisioning ' + (user.approved_for_provisioning ? 'approved': 'disabled') }>
                                    {
                                        user.approved_for_provisioning ?
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
                                    <span className={'registered-developer ' + (user.registered_developer ? 'yes' : 'no')}>
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
