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
var BB = require('../../bb');

var adminui = require('../../../adminui');

var FWRulesList = require('../../pages/vm/fwrules-list');
var FWRulesForm = require('../../pages/vm/fwrules-form');


var UserFirewall = React.createClass({
    getInitialState: function() {
        return {
            editing: false
        };
    },
    componentWillMount: function() {
        this.fwrulesList = new FWRulesList({
            user: this.props.user
        });

        this.fwrulesList.on('itemview:edit:rule', function(iv) {
            iv.$el.addClass('editing');
            this.fwrulesForm = new FWRulesForm({
                user: this.props.user,
                model: iv.model
            });
            this.setState({ editing: 'fwrule' });

            this.fwrulesForm.on('close', function() {
                this.setState({ editing: false });
                iv.$el.removeClass('editing');
            }, this);

            this.fwrulesForm.on('rule:saved', function() {
                this.setState({ editing: false });
                this.fwrulesList.collection.fetch();
            }, this);
        }, this);
    },
    _handleAddFirewallRule: function() {
        this.fwrulesForm = new FWRulesForm({ user: this.props.user });
        this.setState({ editing: 'fwrule' });

        this.fwrulesForm.on('close', function() {
            this.setState({ editing: false });
        }, this);

        this.fwrulesForm.on('rule:saved', function() {
            this.setState({ editing: false });
            this.fwrulesList.collection.fetch();
        }, this);
    },
    render: function() {
        return <div className="user-firewall">
            <h3>User Firewall
                <div className="actions">
                {
                    adminui.user.role('operators') ?
                    <button onClick={this._handleAddFirewallRule} className="btn btn-info"><i className="fa fa-plus" /> Add Firewall Rule</button>
                    : null
                }
                </div>
            </h3>
            <div className="fwrules-form-region">
                {this.state.editing === 'fwrule' ? <BB view={this.fwrulesForm} /> : null }
            </div>
            <div className="fwrules-list-region panel">
                <div className="panel-body">
                    <BB view={this.fwrulesList} />
                </div>
            </div>
        </div>;
    }
});

module.exports = UserFirewall;
