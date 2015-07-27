/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var moment = require('moment');
var adminui = require('../adminui');

var ServerTime = React.createClass({
    componentWillMount: function () {
        this._getTime();
    },
    componentDidMount: function () {
        adminui.vent.on('changeTime', this._getTime, this);
    },
    _getTime: function (time) {
        this.setState({time: moment(time || new Date()).utc().format("MMMM D H:mm") + 'Z' });
    },
    render: function () {
        return (
            <div id="server-time">
                <i className="fa fa-clock-o"></i>
                <time>{this.state.time}</time>
            </div>
        );
    }
});

module.exports = ServerTime;
