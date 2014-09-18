/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var $ = require('jquery');
require('epoch');
var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');

var ServerMemoryUtilizationCircle = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.server];
    },

    propTypes: {
        server: React.PropTypes.object.isRequired,
        diameter: React.PropTypes.string.isRequired,
        inner: React.PropTypes.string.isRequired
    },


    getChartData: function() {
        var model = this.props.server;
        var total = model.get('memory_total_bytes');
        var provisionable = model.get('memory_provisionable_bytes');
        if (provisionable <= 0) { provisionable = 0; }
        var reserved = total * model.get('reservation_ratio');
        var used = (total * (1-model.get('reservation_ratio')) - provisionable);

        if (used < 0) { used = 0; }

        var pieData = [
            {label: 'reserved', value: reserved },
            {label: 'Used', value: used },
            {label: 'Provisionable', value: provisionable },
        ];
        return pieData;
    },
    drawMemoryGraph: function() {
        var $node = $(this.getDOMNode()).find('.graph');

        if (this.chart) {
            console.log('redraw');
            this.chart.update(this.getChartData());
        } else {
            this.chart = $node.epoch({
                type: 'pie',
                data: this.getChartData(),
                inner: this.props.inner,
            });
        }
    },
    componentDidMount: function() {
        this.drawMemoryGraph();
        this.props.server.on('change:memory_provisionable_bytes change:reservation_ratio', this.drawMemoryGraph, this);
    },
    componentWillUnmount: function() {
        this.props.server.off('change:memory_provisionable_bytes change:reservation_ratio', this.drawMemoryGraph);
    },
    render: function() {
        var diameter = parseInt(this.props.diameter);
        var percentmTop = (-(diameter/2) - 9) + 'px';
        var server = this.props.server.toJSON();
        server.memory_total_provisionable_bytes = (server.memory_total_bytes * (1-server.reservation_ratio));
        server.memory_used_provisionable_bytes = (server.memory_total_provisionable_bytes - server.memory_provisionable_bytes);

        server.memory_utilization_percent = Math.round(server.memory_used_provisionable_bytes / server.memory_total_provisionable_bytes * 100);
        if (server.memory_utilization_percent <= 0) {
            server.memory_utilization_percent = 0;
        }
        var pctSize, labelSize;
        if (parseInt(this.props.diameter) > 100) {
            pctSize = '18px';
            labelSize = '10px';
            percentmTop = parseInt(percentmTop) - 2 + 'px';
        }

        return <div className="server-memory-utilization-circle" style={ {width: this.props.diameter, height: this.props.diameter} }>
            <div className="graph epoch" style={ {width: this.props.diameter, height: this.props.diameter} }></div>
            <div className="percent" style={ { 'font-size': pctSize, 'margin-top': percentmTop}}>
                <strong style={ { 'font-size':labelSize }}>UTILIZATION</strong> {server.memory_utilization_percent}%
            </div>
        </div>;
    }
});

module.exports = ServerMemoryUtilizationCircle;
