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
var Chosen = require('react-chosen');

var Images = require('../../../../models/images');
var api = require('../../../../request');
var _ = require('underscore');

var OPERATING_SYSTEMS = require('./constants').OPERATING_SYSTEMS;

var Form = React.createClass({
    propTypes: {
        user: React.PropTypes.string.isRequired,
        initialLimit: React.PropTypes.object
    },
    getInitialState: function() {
        var state = {};
        if (this.props.initialLimit && this.props.initialLimit.check) {
            state = this.fromLimit(this.props.initialLimit);
        } else {
            this.props.initialLimit = null;
            state.limitUnit  = 'ram';
            state.criteriaType = 'any';
        }
        state.images = [];
        state.datacenters = [];
        return state;
    },
    componentDidMount: function() {
        this.loadImages();
        this.loadDatacenters();
    },
    componentWillUnmount: function() {
        if (this.request) {
            this.request.abort();
        }
    },
    loadDatacenters: function() {
        api.get('/api/datacenters').end(function(res) {
            if (res.ok) {
                var dcs = res.body.map(function(dc) {
                    return dc.datacenter;
                });
                if (this.state.datacenter) {
                    dcs.push(this.state.datacenter);
                }
                this.setState({ datacenters: _.unique(dcs) });
            }
        }.bind(this));
    },
    loadImages: function() {
        var collection = new Images([], {
            params: { repository: 'https://images.joyent.com' }
        });
        this.request = collection.fetch().done(function(images) {
            var imageNames = _.pluck(images, 'name');
            this.setState({images: _.unique(imageNames).sort() });
        }.bind(this));
    },
    handleChangeDatacenter: function(e) {
        this.setState({datacenter: e.target.value });
    },
    handleChangeCriteriaType: function(e, c) {
        this.setState({criteriaType: c.selected });
    },
    handleChangeCriteriaValue: function(e, c) {
        if (c) {
            this.setState({criteriaValue: c.selected });
        } else {
            this.setState({criteriaValue: e.target.value });
        }
    },

    handleChangeLimitValue: function(e) {
        this.setState({limitValue: e.target.value });
    },

    handleChangeLimitUnit: function(e, c) {
        this.setState({limitUnit: c.selected });
    },

    fromLimit: function(limit) {
        var state = {};
        if (!limit.check || limit[limit.check] === 'any' || typeof(limit[limit.check]) === 'undefined') {
            state.criteriaType = 'any';
            state.criteriaValue = null;
        } else {
            state.criteriaType = limit.check;
            state.criteriaValue = limit[limit.check];
        }
        state.datacenter = limit.datacenter;
        state.limitUnit = limit.by;
        state.limitValue = limit.value;
        return state;
    },

    isValid: function() {
        var valid = (this.state.criteriaType && this.state.limitUnit && this.state.limitValue);
        if (this.state.criteriaType !== 'any' && (!this.state.criteriaValue || 0 === this.state.criteriaValue.length)) {
            valid = false;
        }
        console.log('validation', this.state, valid);

        return valid;
    },

    toLimit: function() {
        var state = this.state;
        var data = {};
        data.datacenter = state.datacenter;
        if (state.criteriaType === 'any') {
            data.check = 'os';
            data.os = 'any';
        } else {
            data.check = state.criteriaType;
            data[state.criteriaType] = state.criteriaValue;
        }
        data.by = state.limitUnit;
        data.value = state.limitValue;
        return data;
    },
    handleCancel: function() {
        this.props.handleCancel();
    },
    handleSave: function() {
        var limit = this.toLimit();
        var req;
        if (this.props.initialLimit) {
            req = api.patch(_.str.sprintf('/api/users/%s/limits/%s', this.props.user, limit.datacenter));
        } else {
            req = api.post(_.str.sprintf('/api/users/%s/limits/%s', this.props.user, limit.datacenter));
        }
        req.send({
            limit: limit,
            original: this.props.initialLimit
        }).end(function(err, res) {
                if (res.ok) {
                    this.props.onSaved(res);
                }
            }.bind(this));
    },

    render: function() {
        return <div className="provisioning-limits-form">
                <div className="modal-header">
                { this.props.initialLimit ?
                    <h4 className="modal-title">Update Limit for {this.props.initialLimit.datacenter}</h4> :
                    <h4 className="modal-title">Add New Limit</h4> }
                </div>

            <div className="modal-body">
                <form onSubmit={this.handleSave} className="form-horizontal">
                    <div className="form-group">
                        <label className="col-md-4 control-label">Datacenter</label>
                        <div className="col-md-7">
                            <Chosen className="form-control" placeholder="Select a Datacenter" value={this.state.datacenter} onChange={this.handleChangeDatacenter}>
                            <option value=""></option>
                            {
                                this.state.datacenters.map(function(d) {
                                    return <option value={d}>{d}</option>;
                                })
                            }
                            </Chosen>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="col-md-4 control-label">Limit Provisions to</label>
                        <div className="col-md-3" style={{ paddingRight: 0}}>
                            <input onChange={this.handleChangeLimitValue}
                                type="number"
                                value={this.state.limitValue}
                                className="form-control" />
                        </div>
                        <div className="col-md-4" style={{ paddingLeft: 0}}>
                            <Chosen className="form-control" onChange={this.handleChangeLimitUnit} value={this.state.limitUnit }>
                                <option value="ram">MB of RAM</option>
                                <option value="quota">GB of Disk Space</option>
                                <option value="machines">Virtual Machines</option>
                            </Chosen>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="control-label col-md-4">For</label>
                        <div className="col-md-7">
                            <div>
                                <Chosen className="form-control" value={this.state.criteriaType } onChange={ this.handleChangeCriteriaType }>
                                    <option value="any">Any VM Type</option>
                                    <option value="os">Operating System...</option>
                                    <option value="image">Image...</option>
                                </Chosen>
                            </div>

                            { this.state.criteriaType === 'os' ?
                            <div>
                                <Chosen onChange={this.handleChangeCriteriaValue} value={this.state.criteriaValue}>
                                {
                                    OPERATING_SYSTEMS.map(function(o) {
                                        return <option value={o}>{o}</option>;
                                    })
                                }
                                </Chosen>
                            </div>
                            : '' }


                            { this.state.criteriaType === 'image' ?
                            <input className="form-control" placeholder="Image Name (example: ubuntu)" onChange={this.handleChangeCriteriaValue} value={this.state.criteriaValue} />
                            : '' }

                        </div>
                    </div>

                </form>
            </div>
            <div className="modal-footer">
                <button className="btn btn-default" onClick={this.handleCancel}>Close</button>
                <button disabled={ this.isValid() ? '' : 'disabled' } onClick={this.handleSave} className="btn btn-primary" type="submit">Save Limit</button>
            </div>
        </div>;
    }
});


module.exports = Form;
