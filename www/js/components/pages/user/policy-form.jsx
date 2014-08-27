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
var PropTypes = React.PropTypes;
var UserPolicyForm = React.createClass({
    propTypes: {
        handleSavePolicy: PropTypes.func.isRequired,
        handleCancel: PropTypes.func,
        error: PropTypes.object,
        initialPolicy: PropTypes.object,
    },
    getDefaultProps: function() {
        return {
            handleCancel: function() {},
            error: null
        };
    },
    getInitialState: function() {
        var state;
        if (this.props.initialPolicy) {
            state = this.props.initialPolicy;
        } else {
            state = {
                rules: ['']
            };
        }
        return state;
    },
    render: function() {
        return (
            <div className="panel">
                <div className="panel-body">
                <div className="panel-title">
                    { this.state.uuid ? 'Edit Policy' : 'New Policy'}
                </div>
                { this.props.error && <div className="alert alert-danger">{this.props.error.message}</div> }
                <form className="form form-horizontal" onSubmit={this._handleSubmit}>
                    <div className="form-group">
                        <div className="control-label col-sm-4">Policy Name</div>
                        <div className="controls col-sm-6">
                            <input type="text" placeholder="name of account policy" onChange={this._handleChangeName} value={this.state.name} className="form-control" />
                        </div>
                    </div>

                   <div className="form-group">
                        <div className="control-label col-sm-4">Policy Description</div>
                        <div className="controls col-sm-6">
                            <input type="text" placeholder="describe this policy" onChange={this._handleChangeDescription} value={this.state.description} name="name" className="form-control" />
                        </div>
                    </div>

                   <div className="form-group">
                        <div className="control-label col-sm-4">Rules</div>
                        <div className="controls col-sm-6">
                            {
                                this.state.rules.map(function(r, i) {
                                    return <div key={i} className="input-group">
                                        <input className="form-control" type="text" key={i} onChange={this._handleChangeRule} value={r} data-index={i} />
                                        <div className="input-group-btn">
                                            <button type="button" className="btn btn-link" data-index={i} onClick={this._handleRemoveRule}><i className="fa fa-times"></i></button>
                                        </div>
                                    </div>;
                                }, this)
                            }
                            <button type="button" onClick={this._handleAddAnotherRule} className="btn btn-link"><i className="fa fa-plus" /> Add another rule</button>
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="input-group col-sm-offset-4 col-sm-6">
                            <button type="submit" onClick={this._handleSubmit} className="btn btn-primary">Save Policy</button>
                            <button type="button" onClick={this._handleCancel} className="btn btn-default">Cancel</button>
                        </div>
                    </div>
                </form>
                </div>
            </div>
        );
    },
    _handleCancel: function() {
        this.props.handleCancel();
    },
    _handleRemoveRule: function(e) {
        e.preventDefault();
        var i = e.target.getAttribute('data-index');
        if (i > -1)  {
            var rules = this.state.rules;
            rules = rules.splice(i, 1);
            console.log(i, rules);
            this.setState({rules: rules});
        }
    },
    _handleSubmit: function(e) {
        e.preventDefault();
        var policy = this.state;
        this.props.handleSavePolicy(policy);
    },
    _handleChangeRule: function(e) {
        var r = e.target.value;
        var i = e.target.getAttribute('data-index');
        var rules = this.state.rules;
        rules[i] = r;
        this.setState({rules: rules});
    },
    _handleChangeName: function(e) {
        var n = e.target.value;
        this.setState({name: n});
    },
    _handleChangeDescription: function(e) {
        var d = e.target.value;
        this.setState({description: d});
    },
    _handleAddAnotherRule: function(e) {
        e.preventDefault();
        var rules = this.state.rules;
        rules.push('');
        this.setState({rules: rules});
    }
});

module.exports = UserPolicyForm;
