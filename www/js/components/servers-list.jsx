var moment = require('moment');
var _ = require('underscore');
var BackboneMixin = require('./_backbone-mixin');
var adminui = require('../adminui');
var $ = require('jquery');
var React = require('react');

var Servers = require('../models/servers');
var ServerSetup = require('../views/server-setup');

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

    drawMemoryGraph: function() {
        var model = this.props.server;
        var $node = $(this.getDOMNode()).find('.memory-usage-graph');

        var avail = model.get('memory_provisionable_bytes');
        if (avail < 0) {
            avail = 0;
        }
        var total = model.get('memory_total_bytes');
        var used = total - avail;
        if (used < 0) {
            used = 0;
        }

        var pieData = [
            {label: 'Used', value: (used/total)*100 },
            {label: 'Provisionable', value: (avail/total)*100 },
        ];

        $node.epoch({
            type: 'pie',
            data: pieData,
            inner: 23,
        });

        // var w = $node.width();
        // var h = 4;
        // var paper = new Raphael($node.get(0), w, h);

        // var uw = w * (used/total);
        // var ug = paper.rect(0, 0, 0, h);
        // ug.attr({ 'fill': "#ccc", 'stroke-width': 0 });

        // var fw = w * (avail/total);
        // var fg = paper.rect(uw, 0, 0, h);
        // fg.attr({ 'fill': "#00d295", 'stroke-width': 0 });
        // var uga = Raphael.animation({width: uw}, 300, 'linear');
        // var fga = Raphael.animation({width: fw}, 300, '>');

        // ug.animate(uga.delay(100));
        // fg.animate(fga.delay(400));
    },

    componentDidMount: function() {
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

        if (model.get('setup')) {
            process.nextTick(this.drawMemoryGraph);
        }
    },
    render: function() {
        var server = this.props.server.toJSON();
        _.extend(server, {
            running: server.status === 'running',
            not_setup: server.setup === false,
            last_boot: moment(server.last_boot).fromNow(),
            last_heartbeat: moment(server.last_heartbeat).fromNow(),
            memory_provisionable_mb: _.str.sprintf("%0.2f", server.memory_provisionable_bytes/1024/1024),
            memory_total_mb: _.str.sprintf("%0.2f", server.memory_total_bytes/1024/1024),

            memory_available_gb: _.str.sprintf("%0.2f", server.memory_available_bytes/1024/1024/1024),
            memory_provisionable_gb: _.str.sprintf("%0.2f", server.memory_provisionable_bytes/1024/1024/1024),
            memory_total_gb: _.str.sprintf("%0.2f", server.memory_total_bytes/1024/1024/1024),
        });

        if (Number(server.memory_provisionable_mb) < 0) {
            server.memory_provisionable_mb = "0";
            server.memory_provisionable_gb = "0";
        }
        server.memory_provisionable_percent = Math.round(Number(server.memory_provisionable_mb) / Number(server.memory_total_mb) * 100);

        return <div className="servers-list-item">
            <div className={"status " + server.status}></div>
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
                    <div className="memory-usage-graph epoch"></div>
                    <div className="memory-usage-percent">
                        <strong>UTILIZATION</strong>
                        {100-server.memory_provisionable_percent}%
                    </div>
                </div>
                <div className="memory-usage-data">
                    <div className="memory-usage-avail">
                        <strong>Provisionable</strong>
                        <span className={'avail ' + (!server.memory_provisionable_percent && 'full') }>{server.memory_provisionable_gb} GB</span>
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
                <span>{server.sdc_version}.{server.current_platform}</span>
            </div>

            <div className="last-boot">
                <strong><i className="fa fa-fw fa-power-off"></i></strong> <span>{server.last_boot}</span>
            </div>
            <div className="last-heartbeat">
                <strong><i className="fa fa-fw fa-heart"></i></strong> <span>{server.last_heartbeat}</span></div>
            </div>
        </div>;

    }
});


var ServersListComponent = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.collection];
    },
    componentWillMount: function() {
        this.collection = this.props.collection || new Servers();
        if (this.props.params) {
            this.collection.params = this.props.params;
        }
    },

    componentDidMount: function() {
        var self = this;
        this.collection.fetch();
        this._timer = setInterval(function() {
            self.collection.fetch();
        }, 10000);
    },

    componentWillUnmount: function() {
        console.log('componentWillUnmount');
        clearInterval(this._timer);
    },

    render: function() {
        return <div className="servers-list">
        {
            this.collection.map(function(server) {
                return <ServersListItem key={server.get('uuid')} server={server} />;
            })
        }
        </div>;
    }
});
module.exports = ServersListComponent;
