/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

'use strict';
var React = require('react');
var ErrorAlert =  React.createClass({
    render: function () {
        var error = this.props.error;
        if (!error) {
            return <div className="error-alert alert alert-danger" style={{display: 'none'}}></div>;
        }

        var errorMessage = error.message || (error.errors ? null : error);

        return (<div className="error-alert alert alert-danger">
            {
                errorMessage ? <div><strong>{errorMessage}</strong></div> : ''
            }
            {
                error.errors && error.errors.length ? <ul>
                    {
                        error.errors.map(function (err) {
                            return <li><strong>{err.field}</strong> - {err.message}</li>;
                        })
                    }
                </ul> : ''
            }
        </div>);
    }
});

module.exports = ErrorAlert;
