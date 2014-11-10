/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var React = require('react');

var adminui = require('../../../adminui');
var api = require('../../../request');

function _bytesToGb(val) {
    return val / 1024 / 1024 / 1024;
}


var DashboardPage = React.createClass({
    statics: {
        url: function() {
            return '/dashboard';
        },
        sidebar: 'dashboard'
    },
    getInitialState: function() {
        return {};
    },
    componentWillMount: function() {
        this._requests = [];
    },
    componentDidMount: function() {
        adminui.vent.trigger('settitle', 'dashboard');

        this.fetchStats();
    },
    fetchStats: function() {
        this._requests.push(api.get('/api/stats/all').end(function(res) {
            var body = res.body;
            var state = {};
            state.vmCount = body.vmCount.total;
            state.serverTotalMemory = _.str.sprintf('%.2f GB', _bytesToGb(body.serverMemory.total));
            state.serverCount = body.serverCount.total;
            state.serverReserved = body.serverCount.reserved;
            state.serverUnreserved = body.serverCount.unreserved;
            state.serverProvisionable = _bytesToGb(body.serverMemory.provisionable);

            state.serverUtilization = ((body.serverMemory.total - body.serverMemory.provisionable) / body.serverMemory.total) * 100;
            if (isNaN(state.serverUtilization)) {
                state.serverUtilization =  100;
            }


            this.setState(state);
        }.bind(this)));

        this._requests.push(api.get("/api/users?per_page=1").end(function(res) {
            this.setState({userCount: res.headers['x-object-count']});
        }.bind(this)));
    },
    componentWillUnount: function() {
        this._requests.map(function(r) {
            r.abort();
        });
    },
    render: function() {
        var stats = this.state;
        var haveStats = Object.keys(stats).length;

        return (
            <div id="page-dashboard">
                <div className="row">
                    <div className="col-md-12">
                        <div className="page-header">
                            <h1>Dashboard</h1>
                        </div>
                    </div>
                </div>

                { haveStats ? <div className="col-sm-12">
                    <div className="first-row">
                        <div className="counter">
                            <div className="vms">
                                <div className="name">Virtual Machines</div>
                                <div className="value vm-count">{stats.vmCount}</div>
                            </div>
                        </div>
                        <div className="counter">
                            <div className="users">
                                <div className="name">Users</div>
                                <div className="value user-count">{stats.userCount}</div>
                            </div>
                        </div>
                    </div>
                </div> : null }

                { haveStats ? <div className="col-md-12 servers">
                    <div className="data">
                        <div className="stat servers">
                            <div className="name">Servers</div>
                            <div className="value"><span className="server-count">{stats.serverCount}</span></div>
                        </div>
                        <div className="stat servers-reserved">
                            <div className="name">Servers Reserved</div>
                            <div className="value">
                                <span className="server-reserved">{stats.serverReserved}</span> / <span className="server-count">{stats.serverCount}</span>
                            </div>
                        </div>
                        <div className="stat ram-provisionable-total">
                            <div className="name">RAM Provisionable / Total </div>
                            <div className="value">
                                <span className="server-provisionable-memory">{_.str.sprintf('%.2f', _bytesToGb(stats.serverProvisionable)) } </span> / <span className="server-total-memory">{stats.serverTotalMemory}</span>
                            </div>
                        </div>
                        <div className="stat ram-utilization">
                            <div className="name">Utilization %</div>
                            <div className="value">
                                <span className="server-utilization-percent">{ stats.serverUtilization ? _.str.sprintf('%.2f%%', stats.serverUtilization) : null }</span>
                            </div>
                        </div>
                    </div>
                </div> : null }
            </div>
        );
    }

});

module.exports = DashboardPage;
