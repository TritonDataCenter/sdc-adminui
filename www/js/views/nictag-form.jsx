/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');

var NicTagForm = React.createClass({
    getInitialState: function() {
        return {};
    },
    _onChangeName: function(e) {
        this.setState({name: e.target.value});
    },
    _onChangeMtu: function(e) {
        this.setState({mtu: e.target.value});
    },
    _onSave: function(e) {
        e.preventDefault();
        this.props.handleSave({name: this.state.name, mtu: this.state.mtu});
    },
    render: function() {
        return <div className="panel">
            <div className="panel-body">
                <h4 className="panel-title">New NIC Tag</h4>
                <form className="form form-horizontal">
                    <div className="form-group">
                        <label className="control-label col-sm-5">NIC Tag Name</label>
                        <div className="col-sm-5">
                            <input placeholder="name of NIC Tag (eg: acme-admin)" onChange={this._onChangeName} type="text" value={this.state.name} className="form-control" />
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="control-label col-sm-5">NIC Tag MTU</label>
                        <div className="col-sm-5">
                            <input placeholder="mtu of NIC Tag (eg: >=1500 || <=9000)" onChange={this._onChangeMtu} type="text" value={this.state.mtu} className="form-control" />
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-offset-5 col-sm-5">
                            <button disabled={!(this.state.name && this.state.name.length)} 
                                    className="btn btn-primary" 
                                    onClick={this._onSave} 
                                    type="submit">
                                    Save NIC Tag
                            </button>
                            <button className="btn btn-link" onClick={this.props.handleClose} type="button">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    }
});

module.exports = NicTagForm;
