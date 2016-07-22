/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
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
        var server = this.props.server.toJSON();

        var reserved = server.reservation_ratio * server.memory_total_bytes
        var provisioned = ((1-server.reservation_ratio) * server.memory_total_bytes) - server.memory_provisionable_bytes;
        var provisionable = server.memory_provisionable_bytes;

        if (provisioned < 0) { provisioned = 0; }
        if (provisionable < 0) { provisionable = 0; }

        var pieData = [
            {label: 'Reserved', value: reserved },
            {label: 'Provisioned', value: provisioned },
            {label: 'Provisionable', value: provisionable },
        ];
        return pieData;
    },

    drawMemoryGraph: function() {
        var $node = $(this.getDOMNode()).find('.graph');

        if (this.chart) {
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

        var provisioned = ((1-server.reservation_ratio) * server.memory_total_bytes) - server.memory_provisionable_bytes;
        var total = server.memory_total_bytes;

        var util_percent = Math.round(provisioned / total * 100);
        if (util_percent < 0) { util_percent = 0; }

        var pctSize, labelSize;
        if (diameter > 100) {
            pctSize = '18px';
            labelSize = '10px';
            percentmTop = parseInt(percentmTop) - 2 + 'px';
        }

        return <div className="server-memory-utilization-circle" style={ {width: diameter, height: diameter} }>
            <div className="graph epoch" style={ {width: diameter, height: diameter} }></div>
            <div className="percent" style={ {'fontSize': pctSize, 'marginTop': percentmTop} }>
                <strong style={ {'fontSize': labelSize} }>UTILIZATION</strong> {util_percent}%
            </div>
        </div>;
    }
});

module.exports = ServerMemoryUtilizationCircle;
