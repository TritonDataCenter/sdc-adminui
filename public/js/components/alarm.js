/**
 * @jsx React.DOM
 */
var moment = require('moment');
var React = require('react');
var api = require('../request');

module.exports = React.createClass({
    propTypes: {
        'user': React.PropTypes.string.isRequired,
        'id': React.PropTypes.string.isRequired
    },
    getDefaultProps: function() {
        var evt = {
            "v": 1,
            "type": "probe",
            "user": "a3040770-c93b-6b41-90e9-48d3142263cf",
            "probeUuid": "13b340ad-1e0f-40e3-86cb-e0429d9a4835",
            "clear": false,
            "data": {
                "message": "Log \"/var/svc/log/smartdc-agent-smartlogin:default.log\" matched /Stopping/.",
                "value": 1,
                "details": {
                    "match": "[ Aug 14 05:02:21 Stopping because service restarting. ]"
                }
            },
            "machine": "44454c4c-3200-1042-804d-c2c04f575231",
            // Added by relay:
            "uuid": "f833288e-d68e-478a-bd11-58a4f1358b21",
            "time": 1344920541118,
            "agent": "44454c4c-3200-1042-804d-c2c04f575231",
            "agentAlias": "headnode",
            "relay": "44454c4c-3200-1042-804d-c2c04f575231"
        };

        var alarm = {
            "user": "a3040770-c93b-6b41-90e9-48d3142263cf",
            "id": "1",
            "monitor": "logscan",
            "closed": false,
            "timeOpened": 1332870155860,
            "timeClosed": null,
            "timeLastEvent": 1332870615162,
            "numNotifications": 0,
            "v": 1,
            "faults": [

            ]
        };

        var vm = {
            "uuid": "1c364203-4a7c-4875-aff1-c99aec892de5",
            "alias": "asdf",
            "autoboot": null,
            "brand": "joyent",
            "billing_id": "73a1ca34-1e30-48c7-8681-70314a9c67d3",
            "cpu_cap": null,
            "cpu_shares": null,
            "create_timestamp": null,
            "customer_metadata": {},
            "datasets": [],
            "destroyed": null,
            "firewall_enabled": false,
            "internal_metadata": {},
            "last_modified": null,
            "limit_priv": null,
            "max_locked_memory": null,
            "max_lwps": null,
            "max_physical_memory": null,
            "max_swap": null,
            "nics": [],
            "owner_uuid": "930896af-bf8c-48d4-885c-6573a94b1853",
            "quota": 25,
            "ram": null,
            "resolvers": null,
            "server_uuid": "564d555a-328d-c8c4-4166-fc96982fa89f",
            "snapshots": [],
            "state": "running",
            "tags": {},
            "zfs_io_priority": null,
            "zone_state": null,
            "zpool": null,
            "image_uuid": "06b33b72-ce99-11e3-8fac-6bc848ca3215"
        };

        return {};
    },
    componentWillMount: function() {
        this.fetchAlarm();
    },
    getInitialState: function() {
        return {
            alarm: {},
            probe: {},
            server: null,
            vm: null
        };
    },
    fetchServer: function() {
        api.get('/_/servers/'+this.state.alarm.machine).end(function(err, res) {
            if (res.ok) {
                this.setState({server: res.body});
            }
        }.bind(this));
    },
    fetchVm: function(id) {
        api.get('/_/vms/'+this.state.alarm.machine).end(function(err, res) {
            if (res.ok) {
                this.setState({vm: res.body});
            }
        }.bind(this));
    },
    fetchProbe: function() {
        var url = '/_/amon/probes/'+this.props.user + '/' + this.state.alarm.probe;
        console.log('fetchProbe', this.state.alarm);
        api.get(url).end(function(err, res) {
            if (res.ok) {
                this.setState({probe: res.body});
            }
        }.bind(this));
    },
    fetchAlarm: function() {
        var url = '/_/amon/alarms/'+this.props.user+'/' + this.props.id;
        api.get(url).end(function(err, res) {
            var alarm = res.body;
            this.setState({alarm: alarm});
            if (alarm.probe) {
                this.fetchProbe();
            }
            if (alarm.machine) {
                this.fetchServer(id);
                this.fetchVm(id);
            }
        }.bind(this));
    },

    render: function() {
        console.log(this.state);
        var alarm = this.state.alarm;
        var probe = this.state.probe;

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
                        <span className="brand-info" className="closed">CLOSED</span>
                        :
                        <span className="brand-info" className="opened">OPENED</span>
                    }
                </div>
                <h1 className="col-sm-12">
                    <i className="fa fa-bell"></i> &nbsp;
                    <span className="probe-name">{this.state.probe.name}</span>
                    &nbsp; <span className="probe-type">{this.state.probe.type}</span>
                    <small className="uuid"> {this.props.user}-{this.state.alarm.id}</small>
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
                                            alarm.closed ? <div className="val">{timeClosed}</div>
                                            : <button className="btn btn-link">Close Alarm <i className="fa fa-power-off"></i></button>
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
                            this.state.vm ?
                            <div className="machine">
                                <h6>Machine <span className="alias">{vm.alias}</span></h6>
                                <div className="state pull-right">
                                    <span className={vm.state}>{vm.state}</span>
                                </div>
                                <div className="uuid">{vm.uuid}</div>
                            </div> : ''
                        }

                        {
                            this.state.server ?
                            <div className="machine">
                                <h6>Machine <span className="alias">{server.hostname}</span></h6>
                                <div className="state pull-right">
                                    <span className={vm.state}>{server.status}</span>
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
        </div>
    },
    renderProbe: function() {
        var probe = this.state.probe;
        var contacts = [];
        if (probe.contacts) {
            contacts = probe.contacts.map(function(c) {
                return <span className={c}>{c}</span>
            });
        }
        return <div className="probe">
            <h6>Probe <span className="alias">{probe.name}</span></h6>
            <div className="type">type: {probe.type}</div>
            <div className="uuid">{probe.uuid}</div>
            <div className="state">
                {contacts}
            </div>
        </div>
    }
});
