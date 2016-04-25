/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var _ = require('underscore');
var adminui = require('../../../../adminui');
var api = require('../../../../request');
var Limits = require('../../../../models/limits');
var ProvisioningLimitsList = require('./list.jsx');
var ProvisioningLimitsForm = require('./form.jsx');

var ProvisioningLimits = React.createClass({
    propTypes: {
        user: React.PropTypes.string.isRequired,
        readonly: React.PropTypes.bool
    },
    fetchLimits: function () {
        var collection = new Limits(null, {user: this.props.user});
        var req = collection.fetch();
        req.done(function (res) {
            this.setState({limits: res});
        }.bind(this));
    },
    componentWillMount: function () {
        this.fetchLimits();
    },
    getInitialState: function () {
        return {
            limits: [],
            form: false
        };
    },
    handleDelete: function (limit) {
        var url = _.str.sprintf('/api/users/%s/limits/%s', this.props.user, limit.datacenter);
        api.del(url).query(limit).end(function (err, res) {
            if (res.ok) {
                adminui.vent.trigger('notification', {
                    message: _.str.sprintf('Successfully removed a limit for %s', limit.datacenter)
                });
                this.fetchLimits();
            } else {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: _.str.sprintf('Error removing limit for %s. ', limit.datacenter) + (res.body.message || '')
                });
            }
        }.bind(this));
    },
    handleEdit: function (limit) {
        this.setState({
            form: true,
            formLimit: limit
        });
    },
    handleSaved: function() {
        if (this.state.form) {
            this.setState({form: false});
        }
        adminui.vent.trigger('notification', {
            message: 'Successfully saved limit.'
        });
        this.fetchLimits();
    },
    showNewLimitForm: function () {
        this.setState({
            formLimit: {},
            form: true});
    },
    handleClose: function () {
        if (this.state.form) {
            this.setState({form: false});
        }
    },
    render: function () {

        return (
            <div className="provisioning-limits-component">
                {this.state.form && <ProvisioningLimitsForm
                    onSaved={this.handleSaved}
                    handleCancel={this.handleClose}
                    initialLimit={this.state.formLimit}
                    user={this.props.user} ref="form" />}
                <h3>Provisioning Limits
                    {adminui.user.role('operators') &&
                        <div className="actions">
                            <button onClick={this.showNewLimitForm} className="btn btn-sm btn-info"><i className="fa fa-plus"></i> New Limit</button>
                        </div>}
                </h3>
                <ProvisioningLimitsList
                    readonly={this.props.readonly}
                    handleEdit={this.handleEdit}
                    handleDelete={this.handleDelete}
                    limits={this.state.limits} />
            </div>
        );
    }
});


module.exports = ProvisioningLimits;
