/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM */

var React = require('react');
var _ = require('underscore');
var api = require('../../../request');


var MantaAgentsDashboard = React.createClass({
    displayName: 'MantaAgentsDashboard',
    statics: {
        'sidebar':'manta-agents',
        'url': function() {
            return '/manta/agents';
        }
    },

    _parseData: function(data) {
        var _agents = data.cs_objects.agent;
        var _service = data.cs_objects.service;
        var _zones = data.cs_objects.zone;
        var _stats = data.cs_objects.stats;

        var hosts = [];

        var agentData = {};
        var zoneData = {};

        for (var agentUuid in _agents) {
            var a = _agents[agentUuid][0];

            a.started = _stats[a.origin][0].started;
            a.nzones = 0;

            a.nbusy = 0;
            a.ninit = 0;
            a.ndisabled = 0;

            agentData[a.origin] = a;
        }

        for (var origin in agentData) {
            zoneData[origin] = {};
        }

        for (var zoneUuid in _zones) {
            var z = _zones[zoneUuid][0];
            var agent = agentData[z.origin];

            if (!agent) { continue; }

            agent.nzones++;

            if (z.state === 'busy') { agent.nbusy++; }
            if (z.state === 'uninit') { agent.ninit++; }
            if (z.state === 'disabled') { agent.ndisabled++; }

            zoneData[z.origin][zoneUuid] = z;
        }
        return {
            agentData: agentData,
            zoneData: zoneData
        };
    },
    componentDidMount: function() {
        this._interval = setInterval(this._fetchAgentsSnapshot, 10 * 1000);
        this._fetchAgentsSnapshot();
    },
    getInitialState: function() {
        return {};
    },
    _loadTestData: function() {
        var TEST_DATA = require('./agents.prod.json');
        this.setState(this._parseData(TEST_DATA));
    },
    _fetchAgentsSnapshot: function() {
        api.get('/api/manta/agents').end(function(res) {
            if (res.ok) {
                var data = this._parseData(res.body);
                this.setState(data);
            }
        }.bind(this));
    },
    _renderAgent: function(a) {
        return (<li key={a.agent}>
            <div className="agent-info">
                <div className="agent-where">
                    <span className="dc">{a.datacenter}</span> <span className="host">{a.hostname}</span>
                </div>
                <div className="zstats">
                    <span className="busy"><strong>B</strong>{a.nbusy}</span>
                    <span className="reset"><strong>R</strong>{a.ninit}</span>
                    <span className="disabled"><strong>D</strong>{a.ndisabled}</span>
                    <span className="nzones"><strong>Z</strong>{a.nzones}</span>
                    <span className="tasks"><strong>T</strong>{a.nTasks}</span>
                </div>
            </div>
            <div className="zones">
                {
                    _.map(this.state.zoneData[a.origin], function(z) {
                        return <div key={z.zonename} className={'zone ' + z.state}></div>;
                    })
                }
            </div>
            <div className="stats">
                <div className="stats-slopdisk">
                    <strong><abbr title="unallocated disk space available for jobs that request additional disk space">Disk slop used</abbr></strong>
                    <span className="value">{a.slopDiskUsed} / {a.slopDiskTotal} GB</span>
                </div>
                <div className="stats-slopmem">
                    <strong><abbr title="unallocated memory available for jobs that request additional memory">Mem slop used</abbr></strong>
                    <span className="value">{a.slopMemUsed} / {a.slopMemTotal} MB</span>
                </div>
                <div className="stats-started">
                    <strong>Started</strong>
                    <span className="value">{a.started.substr(5, 14)}</span>
                </div>
            </div>
        </li>);
    },
    componentWillUnmount: function() {
        clearInterval(this._interval);
    },
    render: function() {
        return <div id="page-manta-agents-dashboard">
            <div className="page-header">
                <h1>Agents</h1>
            </div>
            <div>
                <ul className="list-unstyled agents-list">
                { _.map(this.state.agentData, this._renderAgent, this) }
                </ul>
            </div>
            <button onClick={this._loadTestData} className="btn btn-primary">DEV: Load Prod Data</button>
        </div>;
    }
});


module.exports = MantaAgentsDashboard;
