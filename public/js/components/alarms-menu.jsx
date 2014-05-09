/**
 * @jsx React.DOM
 */

var api = require('../request');
var adminui = require('../adminui');
var React = require('react');

module.exports = React.createClass({
    propTypes: {
        'user': React.PropTypes.string.isRequired
    },
    getInitialState: function() {
        return { menu: false, alarms: [], probes: {} };
    },
    toggleMenu: function() {
        this.setState({menu: !this.state.menu});
    },
    componentWillMount: function() {
        this.fetchAlarms();
    },
    fetchProbe: function(id) {
        var user = this.props.user;
        api.get('/_/amon/probes/'+this.props.user + '/' + id).end(function(err, res) {
            var probes = this.state.probes;
            probes[id] = res.body;
            if (res.ok) {
                this.setState({probes: probes});
            }
        }.bind(this));

    },
    fetchAlarms: function() {
        var user = this.props.user;
        api.get('/_/amon/alarms').query({user: user}).end(function(err, res) {
            if (res.ok) {
                var alarms = res.body;
                this.setState({alarms: alarms});
                alarms.map(function(a) {
                    this.fetchProbe(a.probe);
                }.bind(this));
            }
        }.bind(this));
    },
    gotoAlarm: function(alarm) {
        console.log('go to alarm', alarm);
        adminui.vent.trigger('showcomponent', 'alarm', { user: alarm.user, id: alarm.id });
    },
    renderMenuItem: function(alarm) {
        var probe = this.state.probes[alarm.probe];
        return (<div className="alarm-menu-item">
            <div className="alarm-menu-item-header">
                <div className="alarm-menu-item-icon">
                    <i className="fa fa-warning"></i>
                </div>
                {
                    probe && probe.length ?
                    <a onClick={this.gotoAlarm.bind(null, alarm)} className="probe">
                        <span className="probe-name">{probe.name}</span>
                        <span className="probe-type">{probe.type}</span>
                    </a> :
                    <a onClick={this.gotoAlarm.bind(null, alarm)} className="probe"><span className="probe-name">{alarm.probe}</span></a>
                }
            </div>
            <div className="alarm-menu-item-content">
                <div className="faults">
                {alarm.faults.map(function(f) {
                    return <div className="fault">
                    {f.event.data.message}
                    </div>
                })}
                </div>
            </div>
        </div>);
    },
    menu: function() {
        if (this.state.menu) {
            if (this.state.alarms.length) {
                return <div className="alarms-menu">
                    {this.state.alarms.map(this.renderMenuItem.bind(this))}
                </div>
            } else {
                return <div id="alarms-menu" className="alarms-menu">
                    <div className="alarm-menu-item no-alarms">
                        <div className="alarm-menu-item-content">
                            <i className="fa fa-check"></i> There are no Alarms at this time.
                        </div>
                    </div>
                </div>
            }
        } else {
            return '';
        }
    },
    render: function() {
        return <div className="alarms-menu-container">
            <a onClick={this.toggleMenu} className={
                ('toggle ' + (this.state.menu ? ' active ' : '' ) + (this.state.alarms.length ? ' has-alarms ' : '' ))
            }><i className="fa fa-bell"></i> { this.state.alarms.length }</a>
            {this.menu()}
        </div>
    }
})
