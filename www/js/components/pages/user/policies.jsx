/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var PropTypes = React.PropTypes;
var _ = require('underscore');

var api = require('../../../request');
var UserPolicyForm = require('./policy-form');
var adminui = require('../../../adminui');



var UserPolicies = React.createClass({
    propTypes: {
        readonly: PropTypes.bool,
        account: PropTypes.string.isRequired
    },
    getInitialState: function () {
        return {
            policies: [],
            policyForm: false
        };
    },
    componentWillReceiveProps: function () {
        this._fetchPolicies();
    },
    componentWillMount: function () {
        this._fetchPolicies();
    },
    _policiesApiUrl: function () {
        return _.str.sprintf('/api/users/%s/policies', this.props.account);
    },
    _handleSavePolicy: function (policy) {
        var clonedPolicy = _.clone(policy);
        var req;
        if (clonedPolicy.uuid) {
            req = api.put(_.str.sprintf('%s/%s', this._policiesApiUrl(), p.uuid));
        } else {
            req = api.post(this._policiesApiUrl());
        }
        req.send(clonedPolicy).end(function (res) {
            if (res.ok) {
                this.setState({
                    policyFormError: null,
                    policyFormInitialPolicy: null,
                    policyForm: false
                });
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('Policy %s saved successfully.', res.body.name)
                });
                this._fetchPolicies();
            } else {
                this.setState({policyFormError: res.body});
            }
        }.bind(this));
    },
    _fetchPolicies: function () {
        this.setState({loading: true});
        api.get(this._policiesApiUrl()).end(function (res) {
            if (res.ok) {
                this.setState({
                    loading: false,
                    policies: res.body
                });
            }
        }.bind(this));
    },
    renderPolicy: function (policy) {
        return <div key={policy.uuid} className="panel policy">
            <div className="panel-body">
                <div className="row">
                    <div className="col-xs-2">
                        <div className="name">{policy.name}</div>
                    </div>
                    <div className="col-xs-4">
                        <div className="description">{policy.description}</div>
                    </div>
                    <div className="col-xs-5">
                        {
                            policy.rules.map(function (rule) {
                                return <div key={rule} className="rule"><span className="rule-text">{rule}</span></div>;
                            })
                        }
                    </div>
                    {!this.props.readonly && <div className="col-xs-1">
                        <button type="button" onClick={this._handleEditPolicy.bind(null, policy)} className="btn btn-link edit-policy"><i className="fa fa-pencil"></i></button>
                        <button type="button" onClick={this._handleRemovePolicy.bind(null, policy)} className="btn btn-link btn-danger remove-policy"><i className="fa fa-trash-o"></i></button>
                    </div>}
                </div>
            </div>
        </div>;
    },
    renderPolicies: function () {
         if (this.state.policies.length) {
            return this.state.policies.map(this.renderPolicy, this);
        } else {
            return <div className="no-policies panel"><div className="panel-body">No Account Policies Found</div></div>;
        }
    },
    render: function () {
        return (
        <div className="user-policies">
            <h3>Policies
            {
                !this.props.readonly &&
                <div className="actions">
                    {
                        !this.state.policyForm &&
                        <button onClick={this._handleNewPolicy} className="btn btn-info"><i className="fa fa-plus"/> New Policy</button>
                    }
                </div>

            }
            </h3>
            { this.state.policyForm && <UserPolicyForm
                error={this.state.policyFormError}
                initialPolicy={this.state.policyFormInitialPolicy}
                handleCancel={this._handleCancelNewPolicy}
                handleSavePolicy={this._handleSavePolicy} /> }
            <div className="policies">
                {
                    this.state.loading ?
                        (<div className="panel">
                            <div className="panel-body">
                                <div className="loading-policies">Fetching Account Policies</div>
                            </div>
                        </div>) :
                        this.renderPolicies()
                }
            </div>
        </div>);
    },
    _handleRemovePolicy: function (policy) {
        var msg = _.str.sprintf("Removing %s will remove this policy from roles it's associated with. Are you sure you want to proceed?", policy.name);
        var confirm = window.confirm(msg);
        if (confirm) {
            var url = _.str.sprintf('%s/%s', this._policiesApiUrl(), policy.uuid);
            api.del(url).end(function (res) {
                if (res.ok) {
                    adminui.vent.trigger('notification', {
                        level: 'success',
                        message: _.str.sprintf('Policy %s removed successfully.', policy.name)
                    });
                    this._fetchPolicies();
                }
            });
        }
    },
    _handleEditPolicy: function (policy) {
        this.setState({
            policyForm: true,
            policyFormInitialPolicy: policy
        });
    },
    _handleCancelNewPolicy: function () {
        this.setState({policyForm: false});
    },
    _handleNewPolicy: function () {
        this.setState({policyForm: true});
    }

});

module.exports = UserPolicies;
