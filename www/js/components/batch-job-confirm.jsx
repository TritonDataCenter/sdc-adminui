/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Modal = require('./modal');
var React = require('react');

var BatchJobConfirm = React.createClass({
    displayName: 'BatchJobConfirm',
    propTypes: {
        items: React.PropTypes.array.isRequired,
        prompt: React.PropTypes.string.isRequired,
        action: React.PropTypes.string.isRequired,
        onClose: React.PropTypes.func.isRequired,
        onConfirm: React.PropTypes.func.isRequired
    },
    render: function () {
        var state = this.props.state || 'state';
        var alias = this.props.alias || 'alias';
        var onClose = this.props.onClose || function () {};
        return <Modal id="batch-action-preview" onRequestHide={onClose} title={this.props.prompt} ref="modal">
            <div className="modal-body">
                {
                    this.props.items.map(function (item) {
                        var reservedStatus = '';
                        if (this.props.showReservedStatus) {
                            var status = item.reserved ? 'reserved' : 'un-reserved';
                            reservedStatus = <span className={'state ' + status}>{status}</span>
                        }
                        return <div key={item.uuid} className="item row">
                            <div className="col-sm-2">
                                <span className={'state ' + item[state]}>{item[state]}</span>
                            </div>
                            <div className="col-sm-7">
                                <div className="alias">{item[alias]}</div>
                                <div className="uuid">{item.uuid}</div>
                            </div>
                            <div className="col-sm-3">
                                {reservedStatus}
                            </div>
                        </div>;
                    }, this)
                }
            </div>
            <div className="modal-footer">
                <button type="button" onClick={onClose} className="btn btn-link">Cancel</button>
                <button type="button" onClick={this.props.onConfirm} className="btn btn-primary">{this.props.action}</button>
            </div>
        </Modal>;
    }
});


module.exports = BatchJobConfirm;
