/**
 * @jsx React.DOM
 */
var moment = require('moment');
var React = require('react');
var api = require('../../request');

module.exports = React.createClass({
    propTypes: {
        'user': React.PropTypes.string.isRequired,
        'id': React.PropTypes.string.isRequired
    },
    getDefaultProps: function() {
        return {};
    },
    componentWillMount: function() {
        this.fetchAlarm();
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
            if (! res.ok) {
                if (res.notFound) {
                    this.setState({loading: false, notFound: true});
                } else {
                    this.setState({ loading: false, error: res.body });
                }
                return;
            }

            var alarm = res.body;
            this.setState({alarm: alarm, loading: false});
            if (alarm.probe) {
                this.fetchProbe();
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
                    <span className="brand-info" className="loading">LOADING...</span>
                </div>
            </div>
            </div>
        );
    },

    renderError: function() {
        return <div id="page-alarm" className="error">
            <div className="page-header row">
                <div className="state col-sm-12">
                    <span className="brand-danger" className="error">ERROR</span>
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
        </div>
    },

    renderNotFound: function() {
        return (
            <div id="page-alarm" className="not-found">
                <div className="page-header row">
                    <div className="state col-sm-12">
                        <span className="brand-info" className="not-found">ALARM NOT FOUND</span>
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
        )
    },
    render: function() {
        console.log(this.state);

        if (this.state.error) {
            return this.renderError();
        }

        if (this.state.loading) {
            return this.renderLoading();
        }
        if (this.state.notFound) {
            return this.renderNotFound();
        }


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
