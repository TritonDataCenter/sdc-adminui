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

var api = require('../../../request');
var UserPolicyForm = require('./policy-form');
var adminui = require('../../../adminui');



var UserPolicies = React.createClass({
    propTypes: {
        readonly: PropTypes.bool,
        account: PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            policies: [],
            policyForm: false
        };
    },
    componentWillReceiveProps: function() {
        this._fetchPolicies();
    },
    componentWillMount: function() {
        this._fetchPolicies();
    },
    _policiesApiUrl: function() {
        return _.str.sprintf('/api/users/%s/policies', this.props.account);
    },
    _handleSavePolicy: function(policy) {
        var p = _.clone(policy);
        var req;
        if (p.uuid) {
            req = api.put(_.str.sprintf('%s/%s', this._policiesApiUrl(), p.uuid));
        } else {
            req = api.post(this._policiesApiUrl());
        }
        req.send(p).end(function(res) {
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
                console.log('success save policy', res.body);
                this._fetchPolicies();
            } else {
                console.log(res.error, res.body);
                this.setState({policyFormError: res.body});
            }
        }.bind(this));
    },
    _fetchPolicies: function() {
        this.setState({loading: true});
        api.get(this._policiesApiUrl()).end(function(res) {
            if (res.ok) {
                var policies = res.body;

                this.setState({
                    loading: false,
                    policies: res.body
                });
            }
        }.bind(this));
    },
    renderPolicy: function(p) {
        return <div key={p.uuid} className="panel policy">
            <div className="panel-body">
                <div className="row">
                    <div className="col-xs-2">
                        <div className="name">{p.name}</div>
                    </div>
                    <div className="col-xs-4">
                        <div className="description">{p.description}</div>
                    </div>
                    <div className="col-xs-5">
                        {
                            p.rules.map(function(r) {
                                return <div key={r} className="rule"><span className="r">{r}</span></div>;
                            })
                        }
                    </div>
                    { !this.props.readonly && <div className="col-xs-1">
                        <button type="button" onClick={this._handleEditPolicy.bind(null, p)} className="btn btn-link edit-policy"><i className="fa fa-pencil"></i></button>
                        <button type="button" onClick={this._handleRemovePolicy.bind(null, p)} className="btn btn-link remove-policy"><i className="fa fa-trash-o"></i></button>
                    </div> }
                </div>
            </div>
        </div>;
    },
    renderPolicies: function() {
         if (this.state.policies.length) {
            return this.state.policies.map(this.renderPolicy, this);
        } else {
            return <div className="no-policies panel"><div className="panel-body">No Account Policies Found</div></div>;
        }
    },
    render: function() {
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
    _handleRemovePolicy: function(p) {
        var msg = _.str.sprintf("Removing %s will remove this policy from roles it's associated with. Are you sure you want to proceed?", p.name);
        var c = window.confirm(msg);
        if (c) {
            var url = _.str.sprintf('%s/%s', this._policiesApiUrl(), p.uuid);
            api.del(url).end(function(res) {
                if (res.ok) {
                    adminui.vent.trigger('notification', {
                        level: 'success',
                        message: _.str.sprintf('Policy %s removed successfully.', p.name)
                    });
                    this._fetchPolicies();
                }
            });
        }
    },
    _handleEditPolicy: function(p) {
        this.setState({
            policyForm: true,
            policyFormInitialPolicy: p
        });
    },
    _handleCancelNewPolicy: function() {
        this.setState({policyForm: false});
    },
    _handleNewPolicy: function() {
        this.setState({policyForm: true});
    }

});

module.exports = UserPolicies;
