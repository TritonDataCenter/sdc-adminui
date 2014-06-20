var React = require('react');
var PropTypes = React.PropTypes;
var api = require('../../../request');
var _ = require('underscore');
var Chosen = require('react-chosen');
var Promise = require('promise');

var UserRolesForm = React.createClass({
    propTypes: {
        initialRole: PropTypes.object,
        account: PropTypes.string.isRequired,
        handleSaved: PropTypes.func,
        handleClose: PropTypes.func
    },
    componentWillMount: function() {
        this._fetchAccountPolicies().done(this._onFetchAccountPolicies);
    },
    componentWillReceiveProps: function() {
        this._fetchAccountPolicies().done(this._onFetchAccountPolicies);
    },

    getInitialState: function() {
        var role = this.props.initialRole;
        var state = {};
        state.loading = role ? true : false;
        state.policies = [];
        state.selectedPolicies = [];
        state.selectPolicy = false;
        state.selectPolicyCurrent = {};

        return state;
    },

    _onFetchAccountPolicies: function() {
        var role = this.props.initialRole;
        var state = this.state;

        if (role) {
            state.name = role.name;
            state.uuid = role.uuid;
            if (role.policies && _.isArray(role.policies)) {
                state.selectedPolicies = role.policies.map(function(p) {
                    var matches = p.match(/policy-uuid=([a-z0-9-]+), uuid=([a-z0-9-]+)/);
                    var policyUuid = matches[1];
                    var account = matches[2];
                    var policy = _.findWhere(state.policies, {uuid: policyUuid});
                    return policy;
                });
            }
        }

        if (!state.selectedPolicies) { state.selectedPolicies = []; }
        if (!state.name) { state.name = ''; }
        state.loading = false;
        this.setState(state);
    },


    _fetchAccountPolicies: function() {
        var url = _.str.sprintf('/api/users/%s/policies', this.props.account);
        var self = this;
        return new Promise(function(resolve, reject)  {
            api.get(url).end(function(res) {
                if (res.ok) {
                    self.setState({policies: res.body});
                    resolve(res.body);
                } else {
                    reject('error fetching policies');
                }
            });
        });
    },


    _enterSelectPolicyMode: function() {
        this.setState({selectPolicy: true});
    },

    _exitSelectPolicyMode: function() {
        this.setState({selectPolicy: false});
    },

    _onAddPolicy: function() {
        var selectedPolicies = _.clone(this.state.selectedPolicies);
        selectedPolicies.push(this.state.selectPolicyCurrent);
        this.setState({
            selectedPolicies: selectedPolicies,
            selectPolicyCurrent: {},
            selectPolicy: false
        });
    },

    _onChangeSelectedPolicy: function(e) {
        var v = e.target.value;
        var p = _.findWhere(this.state.policies, {uuid: v});
        console.log('selected policy', p);
        this.setState({selectPolicyCurrent: p});
    },

    _onNameChange: function(e) {
        this.setState({name: e.target.value});
    },

    _removeSelectedPolicy: function(p) {
        var policies = _.reject(this.state.selectedPolicies, function(sp) {
            return sp.uuid === p.uuid;
        });
        this.setState({selectedPolicies: policies});
    },

    _handleSaveRole: function(e) {
        e.preventDefault();

        var payload = {};
        payload.uuid = this.state.uuid;
        payload.name = this.state.name;
        payload.policies = this.state.selectedPolicies.map(function(p) {
            return p.uuid;
        });

        var req;
        var url;

        if (payload.uuid) {
            url = _.str.sprintf('/api/users/%s/roles/%s', this.props.account, payload.uuid);
            req = api.put(url);
        } else {
            url = _.str.sprintf('/api/users/%s/roles', this.props.account);
            req = api.post(url);
        }
        req.send(payload).end(function(res) {
            if (res.ok) {
                this.props.handleSaved(res.body);
            }
        }.bind(this));
    },

    _renderPolicySelect: function() {
        var policiesAvailableForSelect;
        if (this.state.selectedPolicies.length) {
            policiesAvailableForSelect = _.reject(this.state.policies, function(p) {
                var w = _.findWhere(this.state.selectedPolicies, {uuid: p.uuid});
                console.log(w);
                return w !== undefined;
            }, this);
        } else {
            policiesAvailableForSelect = this.state.policies;
        }
        return (
            <div className="role-policy-select">
            <div className="input-group">
                <Chosen
                    noResultsText='No policies available for selection'
                    data-placeholder="Select a Policy" onChange={this._onChangeSelectedPolicy}>
                    <option></option>
                {
                    policiesAvailableForSelect.map(function(p) {
                        return <option key={p.uuid} value={p.uuid}>{p.name} - {p.description}</option>;
                    })
                }
                </Chosen>
                <span className="input-group-btn">
                    <button onClick={this._onAddPolicy} disabled={_.isEmpty(this.state.selectPolicyCurrent)} type="button" className="btn btn-info"><i className="fa fa-plus"></i></button>
                    <button onClick={this._exitSelectPolicyMode} type="button" className="btn btn-default"><i className="fa fa-times"></i></button>
                </span>
            </div>
            </div>
        );
    },

    render: function() {
        var formTitle = <div className="panel-title">
            { this.props.initialRole ? <div>Modify Role <strong>{this.props.initialRole.name}</strong></div> : 'Create New Role' }
        </div>;

        if (this.state.loading) {
            return <div className="panel user-roles-form">
                <div className="panel-body">
                    { formTitle }
                    <div className="loading-role">Retrieving Role Information.</div>
                </div>
            </div>;
        }

        var policies;
        if (!this.state.policies.length && !this.state.selectPolicy) {
            policies = <div className="policy empty">No Policies Selected</div>;
        } else {
            policies = this.state.selectedPolicies.map(function(p, i) {
                return <div key={i} className="policy" data-index={i}>
                <div className="policy-name">{p.name}</div>
                <div className="policy-rules col-xs-7">
                    {p.rules.map(function(r, i) {
                        return <div key={i} className="policy-rule">{r}</div>;
                    })}
                </div>
                <div className="policy-actions col-xs-1">
                <button onClick={this._removeSelectedPolicy.bind(null, p)} className="btn btn-link" type="button">
                    <i className="fa fa-minus"></i>
                </button>
                </div>
                </div>;
            }, this);
        }
        var policySelect = this.state.selectPolicy ? this._renderPolicySelect() : <button type="button" onClick={this._enterSelectPolicyMode} className="btn btn-link btn-sm"><i className="fa fa-plus" /> Add Existing Policy</button>;

        return <div className="panel user-roles-form">
            <div className="panel-body">
                { formTitle }
                <form onSubmit={this._handleSaveRole} className="form form-horizontal">
                    <div className="form-group">
                        <label className="col-xs-2 control-label">Role Name</label>
                        <div className="controls col-xs-6">
                            <input value={this.state.name} onChange={this._onNameChange} type="text" className="form-control" />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-xs-2 control-label">Role Policies</label>
                        <div className="col-xs-9 role-policies-control">
                            <div className="role-policies">
                                { policies }
                                { policySelect }
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-xs-offset-1 col-xs-5">
                            <button disabled={! (this.state.selectedPolicies.length && this.state.name.length) } type="submit" className="btn btn-info">Save Role</button>
                            <button type="button" onClick={this.props.handleClose} className="btn btn-default">Cancel</button>
                        </div>
                    </div>

                </form>
            </div>
        </div>;
    }
});

module.exports = UserRolesForm;
