/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var moment = require('moment');
var _ = require('underscore');
var BackboneMixin = require('./_backbone-mixin');
var adminui = require('../adminui');
var $ = require('jquery');
var React = require('react');

var Servers = require('../models/servers');
var ServerSetup = require('../views/server-setup');
var ServerMemoryUtilizationCircle = require('./pages/server/utilization-circle');

var ServersListItem = React.createClass({
    setup: function() {
        var view = new ServerSetup({ model: this.props.server });
        view.render();
    },

    navigateToServerDetails: function(e) {
        if (e.metaKey) {
            return true;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', { server: this.props.server });
    },

    shouldComponentUpdate: function(nextProps, nextState) {
        var toCheck = ['status', 'setup', 'reservation_ratio'];
        for (var i = 0; i < toCheck.length; i++) {
            if (nextProps.server.get(toCheck[i]) !== this.props.server.get(toCheck[i])) {
                return true;
            }
        }
        return false;
    },

    componentDidUpdate: function() {
        this.postRender();
    },

    componentDidMount: function() {
        this.postRender();
    },

    postRender: function() {
        var model = this.props.server;
        var $node = $(this.getDOMNode());
        $node.find(".last-platform").tooltip({
            title: _.str.sprintf('Platform Version', model.get('current_platform')),
            placement: 'top',
            container: 'body'
        });

        $node.find(".last-boot").tooltip({
            title: _.str.sprintf('Last boot at %s',
                moment(model.get('last_boot')).utc().format('LLL')),
            placement: 'top',
            container: 'body'
        });

        $node.find(".last-heartbeat").tooltip({
            title: _.str.sprintf('Last heartbeat at %s',
                moment(model.get('last_heartbeat')).utc().format('LLL')),
            placement: 'bottom',
            container: 'body'
        });
    },
    render: function() {
        var server = this.props.server.toJSON();
        server.last_boot = moment(server.last_boot).fromNow();
        server.last_heartbeat = moment(server.last_heartbeat).fromNow();
        server.memory_provisionable_mb = _.str.sprintf("%0.2f", server.memory_provisionable_bytes/1048576);
        server.memory_total_mb = _.str.sprintf("%0.2f", server.memory_total_bytes/1048576);
        server.memory_available_gb = _.str.sprintf("%0.2f", server.memory_available_bytes/1073741824);
        server.memory_provisionable_gb = _.str.sprintf("%0.2f", server.memory_provisionable_bytes/1073741824);
        server.memory_total_gb = _.str.sprintf("%0.2f", server.memory_total_bytes/1073741824);

        if (Number(server.memory_provisionable_mb) < 0) {
            server.memory_provisionable_mb = "0";
            server.memory_provisionable_gb = "0";
        }
        server.memory_total_provisionable_bytes = (server.memory_total_bytes * (1-server.reservation_ratio));
        server.memory_used_provisionable_bytes = (server.memory_total_provisionable_bytes - server.memory_provisionable_bytes);
        server.memory_utilization_percent = Math.round(server.memory_used_provisionable_bytes / server.memory_total_provisionable_bytes * 100);
        if (server.memory_utilization_percent < 0) {
            server.memory_utilization_percent = 0;
        }


        return <div className="servers-list-item">
            <div className={"status " + server.status}></div>
            <div className="data">
            <div className="name">
                <a onClick={this.navigateToServerDetails} href={'/servers/' + server.uuid}>{server.hostname}</a>
                { server.reserved && <span className="reserved"><i className="fa fa-lock"></i></span> }
                <span className="uuid"><span className="selectable">{server.uuid}</span></span>
                <div className="traits">
                    { server.headnode && <span className="headnode">HEADNODE</span> }
                    { server.traits.ssd && <span className="ssd">SSD</span> }
                    { server.traits.manta && <span className="manta">MANTA</span> }
                    { server.traits.customer && <span className="customer">CUSTOMER</span> }
                </div>
            </div>

            { server.setup ?
            <div className="memory-usage">
                <div className="memory-usage-graph-container">
                    {this.props.server.get('memory_provisionable_bytes') &&
                        <ServerMemoryUtilizationCircle diameter="80px" inner="23"
                        server={this.props.server} />
                    }
                </div>
                <div className="memory-usage-data">
                    <div className="memory-usage-avail">
                        <strong>Provisionable</strong>
                        <span className={'avail ' + ((server.memory_utilization_percent > 90) && 'full') }>{server.memory_provisionable_gb} GB</span>
                    </div>
                    <div className="memory-usage-total">
                        <strong>Total</strong>
                        <span className="total">{server.memory_total_gb} GB</span>
                    </div>
                </div>
            </div>
            :
            <div className="setup-status">
                { server.setting_up ? 'Setting up' : ''}
                { !server.setting_up && adminui.user.role('operators') ?
                <div>
                    <small className="requires-setup">Requires Setup</small>
                    <button onClick={this.setup} className="setup btn btn-info btn-sm setup"><i className="fa fa-magic"></i> Setup this Server</button>
                </div>
                : ''}
            </div>
        }


        <div className="last-status">
            <div className="last-platform">
                <strong><i className="fa fa-fw fa-location-arrow"></i></strong>
                <span>{server.current_platform}</span>
            </div>

            <div className="last-boot">
                <strong><i className="fa fa-fw fa-power-off"></i></strong> <span>{server.last_boot}</span>
            </div>
            <div className="last-heartbeat">
                <strong><i className="fa fa-fw fa-heart"></i></strong> <span>{server.last_heartbeat}</span>
            </div>
        </div>
    </div>
    </div>;
    }
});


var ServersListComponent = React.createClass({
    mixins: [BackboneMixin],
    getInitialState: function() {
        return { state: 'loading' };
    },
    getBackboneModels: function() {
        return [this.collection];
    },
    componentWillMount: function() {
        this.collection = this.props.collection || new Servers();
        if (this.props.params) {
            this.collection.params = this.props.params;
        }
        this.collection.on('sync', function() {
            this.setState({'state': 'done'});
        }, this);

        this.collection.on('error', function() {
           this.setState({'state': 'error'});
       }, this);
    },

    componentDidMount: function() {
        var self = this;
        this.collection.fetch();
        this._timer = setInterval(function() {
            self.collection.fetch();
        }, 25000);
    },

    componentWillUnmount: function() {
        clearInterval(this._timer);
        this.collection.off('sync');
        this.collection.off('error');
    },

    render: function() {
        var nodes = [];
        switch (this.state.state) {
            case 'done':
                nodes = this.collection.map(function(server) {
                    return <ServersListItem key={server.get('uuid')} server={server} />;
                });
                break;
            case 'loading':
                nodes = <div className="zero-state">Retrieving Servers</div>;
                break;
            case 'error':
                nodes = <div className="zero-state">Error Retrieving Servers List</div>;
                break;
        }
        return <div className="servers-list">{ nodes }</div>;
    }
});
module.exports = ServersListComponent;
