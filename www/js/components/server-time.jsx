/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var moment = require('moment');

var ServerTime = React.createClass({
    componentWillMount: function() {
        this._getTime();
    },
    componentDidMount: function() {
        this._interval = setInterval(this._getTime, 1000);
    },
    _getTime: function() {
        this.setState({time: moment().utc().format("MMM D H:MM") + 'Z' });
    },
    render: function() {
        return <div id="server-time"><i className="fa fa-clock-o"></i> UTC <time>{this.state.time}</time></div>;
    },
    componentWillUnmount: function() {
        clearInterval(this._interval);
    }
});

module.exports = ServerTime;
