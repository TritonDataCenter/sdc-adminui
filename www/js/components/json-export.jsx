/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Modal =require('./modal');
var React = require('react');
var JSONExport = React.createClass({
    render: function() {
        return <Modal {...this.props} title="JSON Export" className="modal json-export">
            <div className="modal-body">
                <p>{this.props.description}</p>
                <textarea style={{minHeight:400}} className="form-control" readOnly value={JSON.stringify(this.props.data, null, 2)}></textarea>
            </div>
        </Modal>;
    }
});

module.exports = JSONExport;
