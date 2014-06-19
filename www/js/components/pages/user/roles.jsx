var React = require('react');
var PropTypes = React.PropTypes;
var _ = require('underscore');
var adminui = require('adminui');

var api = require('../../../request');
var UserRolesForm = require('./roles-form');


var RolePolicyInfo = React.createClass({
    propTypes: {
        dn: PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            policy: {}
        };
    },
    componentWillMount: function() {
        this._fetchPolicy();
    },
    _fetchPolicy: function() {
        // policy-uuid=4de91c34-6784-45ac-aac7-9aa6c3d17013, uuid=930896af-bf8c-48d4-885c-6573a94b1853, ou=users, o=smartdc
        var matches = this.props.dn.match(/policy-uuid=([a-z0-9-]+), uuid=([a-z0-9-]+)/);
        var policy = matches[1];
        var account = matches[2];
        console.log(policy, account);
        if (policy && account) {
            var url = _.str.sprintf('/api/users/%s/policies/%s', account, policy);
            api.get(url).end(function(res) {
                if (res.ok) {
                    this.setState({policy: res.body});
                }
            }.bind(this));
        }
    },
    render: function() {
        return <div className="policy">
            <div className="policy-name">{this.state.policy.name}</div>
        </div>;
    }
});
var RolePoliciesInfo = React.createClass({
    propTypes: {
        role: PropTypes.object.isRequired
    },
    render: function() {
        var role = this.props.role;
        if (role.policies.length === 0) {
            return <div className="no-policies">No policies</div>;
        }

        var nodes = role.policies.map(function(p) {
            return <RolePolicyInfo key={p} dn={p} />;
        });

        return <div className="role-policies">
        <h6>Policies</h6>
        {nodes}
        </div>;
    }
});

var UserRoles = React.createClass({
    propTypes: {
        account: PropTypes.string.isRequired,
        readonly: PropTypes.bool
    },
    getInitialState: function() {
        return {
            roles: [],
            rolesForm: false,
            rolesFormInitialData: {}
        };
    },
    componentWillMount: function() {
        this._fetchRoles();
    },
    render: function() {
        return <div className="user-roles">
            <h3>Account Roles
                {!this.props.readonly && !this.state.rolesForm &&
                    <div className="actions">
                        <button onClick={this._handleNewRole} className="btn btn-info add-role"><i className="fa fa-plus"></i> Add New Role</button>
                    </div>
                }
            </h3>
            {
                this.state.rolesForm && <UserRolesForm
                    account={this.props.account}
                    handleClose={this._handleCloseRolesForm}
                    handleSaved={this._handleSavedRolesForm}
                    initialRole={this.state.rolesFormInitialData} />
            }

            {
                this.state.roles.length ? this._renderRoles() : this._renderEmpty()
            }
        </div>;
    },

    _handleNewRole: function() {
        this.setState({
            'rolesForm': true,
            'rolesFormInitialData': {}
        });
    },

    _renderEmpty: function() {
        return (<div key="empty" className="panel">
            <div className="panel-body">There are no roles under this account</div>
        </div>);
    },
    _renderRoles: function() {
        var nodes = this.state.roles.map(function(r) {
            return <div key={r.uuid} className="panel role">
                <div className="panel-body">
                    <div className="row">
                        <div className="col-xs-4">
                            <div className="role-name">{r.name}</div>
                            <div className="role-uuid">{r.uuid}</div>
                        </div>
                        <div className="role-policies col-xs-6">
                            <RolePoliciesInfo role={r} />
                        </div>
                    </div>
                </div>
            </div>;
        });

        return <div className="roles-list">{nodes}</div>;
    },



    _fetchRoles: function() {
        var url = _.str.sprintf('/api/users/%s/roles', this.props.account);
        api.get(url).end(function(res) {
            if (res.ok) {
                this.setState({roles: res.body});
            }
        }.bind(this));
    },
    _handleSavedRolesForm: function(r) {
        adminui.vent.trigger('notification', {level: 'success',
            message: _.str.sprintf('Role <strong>%s</strong> has been saved.', r.name)
        });
        this.setState({
            rolesForm: false,
            rolesFormInitialData: {}
        });
        this._fetchRoles();
    },

    _handleCloseRolesForm: function() {
        this.setState({
            rolesForm: false,
            rolesFormInitialData: {}
        });
    }
});

module.exports = UserRoles;
