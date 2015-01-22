/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Modal = require('./modal');
var React = require('react');

var BatchJobConfirm = React.createClass({
    displayName: 'BatchJobConfirm',
    propTypes: {
        'vms': React.PropTypes.array.isRequired,
        'prompt': React.PropTypes.string.isRequired,
        'action': React.PropTypes.string.isRequired,
        'onClose': React.PropTypes.func.isRequired,
        'onConfirm': React.PropTypes.func.isRequired
    },
    render: function() {
        return <Modal id="batch-action-preview" onRequestHide={this.props.onClose} title={this.props.prompt} ref="modal">
            <div className="modal-body">
                {
                    this.props.vms.map(function(vm) {
                        return <div className="item row">
                            <div className="col-sm-2">
                                <span className={"state " +vm.state}>{vm.state}</span>
                            </div>
                            <div className="col-sm-10">
                                <div className="alias">{vm.alias}</div>
                                <div className="uuid">{vm.uuid}</div>
                            </div>
                        </div>;
                    }, this)
                }
            </div>
            <div className="modal-footer">
                <button type="button" onClick={this.props.onClose} className="btn btn-link">Cancel</button>
                <button type="button" onClick={this.props.onConfirm} className="btn btn-primary">{this.props.action}</button>
            </div>
        </Modal>;
    }
});


module.exports = BatchJobConfirm;
