/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/**
 * @jsx React.DOM
 */
var React = require('react');

var AlarmsListPage = React.createClass({
    render: function() {
        return (<div className="page-header">
            <h1>Alarms</h1>
        </div>)
    }
});

module.exports = AlarmsListPage;
