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
var moment = require('moment');
var _ = require('underscore');
var React = require('react');
var api = require('../../request');
var adminui = require('adminui');

module.exports = React.createClass({
    displayName: 'PageAlarm',
    propTypes: {
        'user': React.PropTypes.string.isRequired,
        'id': React.PropTypes.string.isRequired
    },
    statics: {
        url: function(props) {
            return _.str.sprintf('/alarms/%s/%s', props.user, props.id);
        }
    },
    getDefaultProps: function() {
        return {};
    },
    componentDidMount: function() {
        this.fetchAlarm(this.props.user, this.props.id);
    },
    componentWillReceiveProps: function(props) {
        this.fetchAlarm(props.user, props.id);
    },
    getInitialState: function() {
        return {
            loading: true,
            error: null,
            alarm: {},
            probe: {},
            server: null,
            vm: null
        };
    },
    fetchServer: function() {
        api.get('/api/servers/'+this.state.alarm.machine).end(function(err, res) {
            if (res.ok) {
                this.setState({server: res.body});
            }
        }.bind(this));
    },
    fetchVm: function(id) {
        api.get('/api/vms/'+this.state.alarm.machine).end(function(err, res) {
            if (res.ok) {
                this.setState({vm: res.body});
            }
        }.bind(this));
    },
    fetchProbe: function() {
        var url = '/api/amon/probes/'+this.props.user + '/' + this._alarm.probe;
        console.log('fetchProbe', this._alarm);
        api.get(url).end(function(err, res) {
            if (res.ok) {
                this.setState({
                    loading: false,
                    alarm: this._alarm,
                    probe: res.body
                });
            }
        }.bind(this));
    },

    fetchProbeGroup: function() {
        var url = '/api/amon/probegroups/'+this.props.user + '/' + this._alarm.probeGroup;
        console.log('fetchProbeGroups', this._alarm);
        api.get(url).end(function(err, res) {
            if (res.ok) {
                this.setState({
                    alarm: this._alarm,
                    probe: res.body,
                    loading: false
                });
            }
        }.bind(this));
    },

    fetchAlarm: function(user, id) {
        this.setState({
            loading: true,
            alarm: {},
            probe: {},
            server: null,
            vm: null
        });

        var url = '/api/amon/alarms/'+user+'/' + id;
        api.get(url).end(function(err, res) {
            if (! res.ok) {
                if (res.notFound) {
                    this.setState({ loading: false, notFound: true});
                } else {
                    this.setState({ loading: false, error: res.body });
                }
                return;
            }

            var alarm = res.body;
            console.log('got-alarm', alarm);
            this._alarm = alarm;

            if (alarm.probe) {
                this.fetchProbe();
            }

            if (alarm.probeGroup) {
                this.fetchProbeGroup();
            }

            if (alarm.machine) {
                this.fetchServer(id);
                this.fetchVm(id);
            }
        }.bind(this));
    },
    renderLoading: function() {
        return (
            <div id="page-alarm">
            <div className="page-header row">
                <div className="state col-sm-12">
                    <span className="loading">LOADING...</span>
                </div>
            </div>
            </div>
        );
    },

    renderError: function() {
        return <div id="page-alarm" className="error">
            <div className="page-header row">
                <div className="state col-sm-12">
                    <span className="error">ERROR</span>
                </div>
                <div className="row">
                    <div className="col-sm-3">
                        <div className="question-icon">
                            <i className="fa fa-question-circle fa-5x"></i>
                        </div>
                    </div>
                    <div className="col-sm-8">
                        <h2>Error Retrieving Alarm</h2>
                        <p>The Alarm <code>#{this.props.id}</code> for user <code>{this.props.user}</code> could not be loaded because Monitoring System said::</p>
                        <p>
                            <pre>{JSON.stringify(this.state.error, null, 2)}</pre>
                        </p>
                    </div>
                </div>
            </div>
        </div>;
    },

    renderNotFound: function() {
        return (
            <div id="page-alarm" className="not-found">
                <div className="page-header row">
                    <div className="state col-sm-12">
                        <span className="not-found">ALARM NOT FOUND</span>
                    </div>
                </div>
                <div className="row">
                    <div className="col-sm-3">
                        <div className="question-icon">
                            <i className="fa fa-question-circle fa-5x"></i>
                        </div>
                    </div>
                    <div className="col-sm-8">
                        <h2>Alarm Not Found</h2>
                        <p>The alarm <code>#{this.props.id}</code> does not exist for user <code>{this.props.user}</code></p>
                    </div>
                </div>
            </div>
        );
    },
    _handleCloseAlarm: function() {
        var url = '/api/amon/alarms/'+this.props.user+'/' + this.props.id;
        api.post(url).query({action: 'close'}).end(function(err, res) {
            if (res.ok) {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'Alarm has been closed'
                });
                adminui.vent.trigger('alarms:changed');
                this.fetchAlarm(this.props.user, this.props.id);
            }
        }.bind(this));
    },
    render: function() {
        adminui.vent.trigger('settitle', _.str.sprintf('alarm: %s.%s', this.props.user, this.props.id));

        if (this.state.error) {
            return this.renderError();
        }

        if (this.state.loading) {
            return this.renderLoading();
        }

        if (this.state.notFound) {
            return this.renderNotFound();
        }

        var vm = this.state.vm;
        var server = this.state.vm;
        var alarm = this.state.alarm;
        // var probe = this.state.probe;

        var dfmt = "D MMM, HH:mm:ss";
        var timeClosed =
            (alarm.closed) ? moment(alarm.timeClosed).utc().format(dfmt)
            : 'not closed';
        var timeOpened = moment(alarm.timeOpened).utc().format(dfmt);
        var timeLastEvent = moment(alarm.timeLastEvent).utc().format(dfmt);

        return (
            <div id="page-alarm">
                <div className="page-header row">
                    <div className="state col-sm-12">
                        {
                            alarm.closed ?
                            <span className="closed">CLOSED</span>
                            :
                            <span className="opened">OPENED</span>
                        }
                    </div>
                    <h1 className="col-sm-12">
                        <i className="fa fa-bell"></i> &nbsp;
                        <span className="probe-name">{this.state.probe.name}</span>
                        &nbsp; <span className="probe-type">{this.state.probe.type}</span>
                        <small className="uuid"> {this.props.user}-{this.props.id}</small>
                        <div className="actions">
                        { !alarm.closed &&
                            <button type="button" onClick={this._handleCloseAlarm} className="btn btn-primary">
                                <i className="fa fa-times"></i> Close Alarm
                            </button> }
                        </div>
                    </h1>
                </div>

                <div className="row">
                    <div className="col-sm-9">
                        <div className="row">
                            <div className="col-md-4">
                                <div className="widget-content">
                                    <div className="lbl"><i className="fa fa-clock-o"></i> Opened at</div>
                                    <div className="val">{timeOpened}</div>
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="widget-content">
                                    <div className="lbl">
                                        {
                                            alarm.closed ?
                                            <div><i className="fa fa-clock-o"></i> Closed at</div> :
                                            <div><i className="fa fa-clock-o"></i> Not Closed</div>
                                        }
                                    </div>
                                        {
                                             <div className="val">{timeClosed}</div>
                                        }
                                </div>
                            </div>
                            <div className="col-md-4">
                                <div className="widget-content">
                                    <div className="lbl"><i className="fa fa-clock-o"></i> Last Event</div>
                                    <div className="val">{timeLastEvent}</div>
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-sm-12 faults-container">
                            {
                                this.state.alarm.faults ? this.state.alarm.faults.map(this.renderFault) : ''
                            }
                            </div>
                        </div>
                    </div>

                    <div className="col-sm-3">
                        {
                            vm ?
                            <div className="machine">
                                <h6>Machine <span className="alias">{vm.alias}</span></h6>
                                <div className="state pull-right">
                                    <span className={vm.state}>{vm.state}</span>
                                </div>
                                <div className="uuid">{vm.uuid}</div>
                            </div> : ''
                        }

                        {
                            server ?
                            <div className="machine">
                                <h6>Machine <span className="alias">{server.hostname}</span></h6>
                                <div className="state pull-right">
                                    <span className={server.status}>{server.status}</span>
                                </div>
                                <div className="uuid">{server.uuid}</div>
                            </div> : ''
                        }

                        { this.renderProbe() }
                    </div>
                </div>
            </div>
        );
    },
    renderFault: function(f) {
        return <div className="fault">
            <div className="event">
                {JSON.stringify(f.event.data, null, 2)}
            </div>
        </div>;
    },
    renderProbe: function() {
        var probe = this.state.probe;
        var contacts = [];
        if (probe.contacts) {
            contacts = probe.contacts.map(function(c) {
                return <span className={c}>{c}</span>;
            });
        }
        return <div className="probe">
            <h6>Probe <span className="alias">{probe.name}</span></h6>
            { probe.type && <div className="type">type: {probe.type}</div> }
            <div className="uuid">{probe.uuid}</div>
            <div className="state">
                {contacts}
            </div>
        </div>;
    }
});
