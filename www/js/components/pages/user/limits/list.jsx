/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');


var UNIT_LABELS = {
    "ram": "MB RAM",
    "quota": "GB DISK",
    "machines": "Machines"
};

/**
 * Properties

 * limits        array limits list
 * handleEdit       fn(limit) clicked Edit Button
 * handleDelete     fn(limit) clicked Delete Button
 */
var ProvisioningLimitsList = React.createClass({
    propTypes: {
        handleEdit: React.PropTypes.func,
        handleDelete: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            handleEdit: function() {},
            handleDelete: function() {},
            readonly: false
        };
    },

    handleEdit: function(limit) {
        this.props.handleEdit(limit);
    },

    handleDelete: function(limit) {
        this.props.handleDelete(limit);
    },

    renderLimit: function(dclimit) {
        var limitsNodes;

        if (dclimit.limit.length === 0) {
            limitsNodes = [<div className="limit zero-state">This datacenter has no limits configured</div>];
        } else {
            limitsNodes = dclimit.limit.map(function(l) {
                l.datacenter = dclimit.datacenter;
                l.by = l.by;
                var byLabel = UNIT_LABELS[l.by];
                // New PROVISIONING LIMITS plugin
                return (
                    <div key={JSON.stringify(l)} className="limit row">
                            { l[l.check] === 'any' ?
                                <div className="check-criteria.any col-sm-3">ANY</div>
                                :
                                <div className={'check-criteria col-sm-3 '+l.check}><strong>{l.check}</strong> {l[l.check]}</div>
                            }
                        <div className="by-criteria col-sm-4">
                            <i className="fa fa-arrow-right"></i>
                            <span className="value">{l.value}</span>
                            <span className="unit">{byLabel}</span>
                        </div>
                            { (!this.props.readonly) ?
                            <div className="actions col-sm-3">
                                <a onClick={this.handleEdit.bind(this, l)} className="edit"><i className="fa fa-pencil"></i> Edit</a>
                                <a onClick={this.handleDelete.bind(this, l)} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
                            </div>
                            : ''
                            }

                    </div>
                );
            }, this);
        }


        return (<div key={dclimit.datacenter} className="limits-dc row">
            <div className="col-sm-3">
                <h5>{dclimit.datacenter}</h5>
            </div>
            <div className="col-sm-9">
                <div className="limits-dc-header row">
                    <div className="criteria-header col-sm-3">CRITERIA</div>
                    <div className="limit-header col-sm-4">LIMIT</div>
                </div>
                {limitsNodes}
            </div>
        </div>);
    },
    renderZeroState: function() {
        return <div className="zero-state">This user does not have any provisioning limits.</div>;
    },
    render: function() {
        return (
            <div className="provisioning-limits-list">
            {
                this.props.limits.length ? this.props.limits.map(this.renderLimit, this) : this.renderZeroState()
            }
            </div>
        );
    }
});


module.exports = ProvisioningLimitsList;
