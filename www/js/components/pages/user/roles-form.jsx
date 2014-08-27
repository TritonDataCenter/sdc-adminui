/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var React = require('react');
var PropTypes = React.PropTypes;
var api = require('../../../request');
var _ = require('underscore');
var Chosen = require('react-chosen');
var Promise = require('promise');
var ErrorAlert = require('../../error-alert');

var UserRolesForm = React.createClass({
    propTypes: {
        initialRole: PropTypes.object,
        account: PropTypes.string.isRequired,
        handleSaved: PropTypes.func,
        handleClose: PropTypes.func
    },
    componentDidMount: function() {
        Promise.all([
            this._fetchAccountPolicies(),
            this._fetchAccountMembers()
        ]).then(this._onFetch);
    },
    componentWillReceiveProps: function() {
        Promise.all(
            this._fetchAccountPolicies(),
            this._fetchAccountMembers()
        ).then(this._onFetch);
    },

    getInitialState: function() {
        var role = this.props.initialRole;
        var state = {};
        state.name = '';
        state.loading = role ? true : false;
        state.policies = [];
        state.selectedPolicies = [];
        state.selectPolicy = false;
        state.selectPolicyCurrent = {};
        state.members = [];
        state.selectedMembers = [];
        state.selectMember = false;
        state.selectMemberCurrent = {};

        return state;
    },

    _onFetch: function() {
        console.debug('onFetch');
        var role = this.props.initialRole;
        var state = this.state;

        if (role) {
            console.log('role', role);
            state.name = role.name;
            state.uuid = role.uuid;
            if (role.policies && _.isArray(role.policies)) {
                console.log('role.policies', role.policies);
                state.selectedPolicies = role.policies.map(function(p) {
                    var matches = p.match(/policy-uuid=([a-z0-9-]+), uuid=([a-z0-9-]+)/);
                    var policyUuid = matches[1];
                    var policy = _.findWhere(state.policies, {uuid: policyUuid});
                    return policy;
                });
            }
            if (role.members && _.isArray(role.members)) {
                console.log('role.members', role.members);
                state.selectedMembers = role.members.map(function(p) {
                    var matches = p.match(/uuid=([a-z0-9-]+), uuid=([a-z0-9-]+)/);
                    var userUuid = matches[1];
                    var user = _.findWhere(state.members, {uuid: userUuid});
                    return user;
                });
            }
        }

        if (!state.name) { state.name = ''; }
        if (!state.selectedPolicies) { state.selectedPolicies = []; }
        if (!state.selectedMembers) { state.selectedMembers = []; }
        state.loading = false;
        console.log('state after fetch', state);
        setTimeout(function() {
            this.setState(state);
        }.bind(this));
    },


    _fetchAccountPolicies: function() {
        var url = _.str.sprintf('/api/users/%s/policies', this.props.account);
        var self = this;
        return new Promise(function(resolve, reject)  {
            api.get(url).end(function(res) {
                if (res.ok) {
                    self.setState({policies: res.body});
                    console.debug('fetched policies', res.body);
                    resolve(res.body);
                } else {
                    console.fatal("error fetching policies", res.error);
                    reject('error fetching policies');
                }
            });
        });
    },

    _fetchAccountMembers: function() {
        var that = this;
        return new Promise(function(resolve, reject)  {
            console.debug('fetching users');
            api.get('/api/users').query({account: that.props.account}).end(function(res) {
                if (res.ok) {
                    console.debug('fetched users', res.body);
                    that.setState({members: res.body});
                    resolve(res.body);
                } else {
                    reject('error fetching members');
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

    _enterSelectMemberMode: function() {
        this.setState({selectMember: true});
    },

    _exitSelectMemberMode: function() {
        this.setState({selectMember: false});
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
   _onAddMember: function() {
        var selectedMembers = _.clone(this.state.selectedMembers);
        selectedMembers.push(this.state.selectMemberCurrent);
        this.setState({
            selectedMembers: selectedMembers,
            selectMemberCurrent: {},
            selectMember: false
        });
    },

    _onChangeSelectedPolicy: function(e) {
        var v = e.target.value;
        var p = _.findWhere(this.state.policies, {uuid: v});
        console.log('selected policy', p);
        this.setState({selectPolicyCurrent: p});
    },

    _onChangeSelectedMember: function(e) {
        var v = e.target.value;
        var m = _.findWhere(this.state.members, {uuid: v});
        console.log('selected member', m);
        this.setState({selectMemberCurrent: m});
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

    _removeSelectedMember: function(p) {
        var members = _.reject(this.state.selectedMembers, function(sp) {
            return sp.uuid === p.uuid;
        });
        this.setState({selectedMembers: members});
    },


    _handleSaveRole: function(e) {
        e.preventDefault();

        var payload = {};
        payload.uuid = this.state.uuid;
        payload.name = this.state.name;
        payload.policies = this.state.selectedPolicies.map(function(p) {
            return p.uuid;
        });
        payload.members = this.state.selectedMembers.map(function(m) {
            return m.uuid;
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
            } else {
                this.setState({error: res.body});
            }
        }.bind(this));
    },

    _renderMemberSelect: function() {
        var membersAvailableForSelect;

        if (this.state.selectedMembers.length) {
            membersAvailableForSelect = _.reject(this.state.members, function(p) {
                var w = _.findWhere(this.state.selectedMembers, {uuid: p.uuid});
                return w !== undefined;
            }, this);
        } else {
            membersAvailableForSelect = this.state.members;
        }
        return (
            <div className="role-policy-select">
                <div className="input-group">
                    <Chosen
                        noResultsText='No members available for selection'
                        data-placeholder="Select a Member" onChange={this._onChangeSelectedMember}>
                        <option></option>
                    {
                        membersAvailableForSelect.map(function(p) {
                            return <option key={p.uuid} value={p.uuid}>{p.alias} - {p.cn}</option>;
                        })
                    }
                    </Chosen>
                    <span className="input-group-btn">
                        <button onClick={this._onAddMember} disabled={_.isEmpty(this.state.selectMemberCurrent)} type="button" className="btn btn-info"><i className="fa fa-plus"></i> Add Member</button>
                        <button onClick={this._exitSelectMemberMode} type="button" className="btn btn-default"><i className="fa fa-times"></i> Cancel</button>
                    </span>
                </div>
            </div>
        );
    },

    _renderPolicySelect: function() {
        var policiesAvailableForSelect;
        if (this.state.selectedPolicies.length) {
            policiesAvailableForSelect = _.reject(this.state.policies, function(p) {
                var w = _.findWhere(this.state.selectedPolicies, {uuid: p.uuid});
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
                        <button onClick={this._onAddPolicy} disabled={_.isEmpty(this.state.selectPolicyCurrent)} type="button" className="btn btn-info"><i className="fa fa-plus"></i> Add Policy</button>
                        <button onClick={this._exitSelectPolicyMode} type="button" className="btn btn-default"><i className="fa fa-times"></i> Cancel</button>
                    </span>
                </div>
            </div>
        );
    },

    render: function() {
        var formTitle = <div className="panel-title">
            { this.props.initialRole ? <div>Modify Role <strong>{this.props.initialRole.name}</strong></div> : 'Create New Role' }
        </div>;

        var loading =
            <div className="panel user-roles-form">
                <div className="panel-body">
                    { formTitle }
                    <div className="loading-role">Retrieving Role Information.</div>
                </div>
            </div>;

        var members;
        if (!this.state.selectedMembers.length && !this.state.selectMember) {
            members = <div className="member empty">No Member Selected</div>;
        } else {
            members = this.state.selectedMembers.map(function(m, i) {
                return <div key={i} className="member" data-index={i}>
                    <div className="member-name">
                        {m.alias} - {m.cn}
                    </div>
                    <div className="member-actions">
                        <button onClick={this._removeSelectedMember.bind(null, m)} className="btn btn-link" type="button">
                            <i className="fa fa-times"></i> Remove
                        </button>
                    </div>
                </div>;
            }, this);
        }

        var policies;
        if (this.state.selectedPolicies.length === 0 && !this.state.selectPolicy) {
            policies = <div className="policy empty">No Policies Selected</div>;
        } else {
            policies = this.state.selectedPolicies.map(function(p, i) {
                return <div key={i} className="policy" data-index={i}>
                <div className="policy-name">{p.name}</div>
                <div className="policy-rules">
                    {p.rules.map(function(r, i) {
                        return <div key={i} className="policy-rule">{r}</div>;
                    })}
                </div>
                <div className="policy-actions">
                <button onClick={this._removeSelectedPolicy.bind(null, p)} className="btn btn-link" type="button">
                    <i className="fa fa-times"></i> Remove
                </button>
                </div>
                </div>;
            }, this);
        }

        var policySelect = this.state.selectPolicy ? this._renderPolicySelect() : <button type="button" onClick={this._enterSelectPolicyMode} className="btn btn-link btn-sm"><i className="fa fa-plus" /> Add Policy</button>;
        var memberSelect = this.state.selectMember ? this._renderMemberSelect() : <button type="button" onClick={this._enterSelectMemberMode} className="btn btn-link btn-sm"><i className="fa fa-plus" /> Add Member</button>;

        return <div className="panel user-roles-form">
            { this.state.error ? <ErrorAlert error={this.state.error} /> : ''}
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
                        <label className="col-xs-2 control-label">Role Members</label>
                        <div className="col-xs-9 role-members-control">
                            <div className="role-members">
                                { members }
                                { memberSelect }
                            </div>
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="col-xs-offset-2 col-xs-5">
                            <button disabled={! (!this.state.selectMember && !this.state.selectPolicy && this.state.name.length) } type="submit" className="btn btn-primary">Save Role</button>
                            <button type="button" onClick={this.props.handleClose} className="btn btn-default">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>;
    }
});

module.exports = UserRolesForm;
