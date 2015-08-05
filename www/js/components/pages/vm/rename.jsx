/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var Modal = require('../../modal');
var VMModel = require('../../../models/vm');


var RenameVm = React.createClass({
    propTypes: {
        uuid: React.PropTypes.string.isRequired,
        onCancel: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return { alias: '', error: null };
    },
    _onChangeInput: function(e) {
        var alias = e.target.value.replace(/[^a-zA-Z0-9-]+/gi, "");
        this.setState({alias: alias});
    },
    componentDidMount: function() {
        this.refs.input.getDOMNode().focus();
    },
    _onSubmit: function(e) {
        e.preventDefault();
        this.setState({error: null});
        var model = new VMModel({uuid: this.props.uuid});
        var alias = this.refs.input.getDOMNode().value;
        var self = this;
        model.set({alias: alias});
        model.saveAlias(function(err, job) {
            if (err) {
                if (err.errors[0].code === 'Duplicate') {
                    self.setState({error: 'This alias is in use by another Virtual Machine owned by this user.'});
                } else {
                    self.setState({error: err.message});
                }
            } else {
                self.props.onJobCreated(job);
            }
        });
    },
    render: function() {
        return <Modal title="Rename Virtual Machine Alias" onRequestHide={this.props.onCancel} {...this.props} ref="modal">
            <div className="modal-body">
                <form onSubmit={this._onSubmit}>
                    {this.state.error ? <div className="alert alert-danger">{this.state.error}</div> : null}
                    <div className="form-group">
                        <input ref="input" onChange={this._onChangeInput} type="text" value={this.state.alias} className="form-control" placeholder="New Virtual Machine Alias" />
                    </div>
                </form>
            </div>
            <div className="modal-footer">
                <button className="btn btn-default" onClick={this.props.onCancel}>Cancel</button>
                <button className="btn btn-primary" disabled={this.state.alias.length === 0} onClick={this._onSubmit} type="submit">Change Virtual Machine Alias</button>
            </div>
        </Modal>;
    }
});

module.exports = RenameVm;
