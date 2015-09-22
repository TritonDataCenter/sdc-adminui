/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';

var React = require('react');
var PropTypes = React.PropTypes;
var _ = require('underscore');
var $ = require('jquery');
var ErrorAlert = require('../../error-alert');

var SSHKeyForm = React.createClass({
    propTypes: {
        handleSave: PropTypes.func,
        handleCancel: PropTypes.func
    },
    getDefaultProps: function () {
        return {
            handleCancel: function () {},
            error: null
        };
    },
    getInitialState: function () {
        return {
            name: '',
            key: ''
        };
    },
    _handleSaveKey: function (e) {
        e.preventDefault();
        var name = $('input[name=name]').val();
        var key = $('textarea[name=key]').val();

        var payload = {
            name: _.str.trim(name),
            key: _.str.trim(key).replace(/(\r\n|\n|\r)/gm, '')
        };
        this.props.handleSave(payload);
    },
    render: function () {
        return (
            <div className="panel user-roles-form">
                {this.props.error ? <ErrorAlert error={this.props.error} /> : ''}
                <div className="panel-body">
                    <div className="panel-title">Add an SSH Key</div>
                    <form onSubmit={this._handleSaveKey} className="form form-horizontal">
                        <div className="form-group">
                        <label className="control-label col-sm-4">SSH Key Name</label>
                            <div className="controls col-sm-6">
                                <input name="name" className="form-control" placeholder="SSH Key Name" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="control-label col-sm-4">SSH Public Key</label>
                            <div className="controls col-sm-6">
                                <textarea name="key" className="form-control" rows="5" placeholder="SSH Public Key"></textarea>
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="input-group col-sm-offset-4 col-sm-6">
                                <button type="submit" onClick={this._handleSaveKey} className="btn btn-primary">Save Key</button>
                                <button type="button" onClick={this.props.handleCancel} className="btn btn-default">Cancel</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    }
});

module.exports = SSHKeyForm;
