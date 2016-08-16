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

        var provisioned = server.disk_pool_size_bytes - (server.unreserved_disk * 1048576);
        var provisionable = server.unreserved_disk * 1048576;

        if (provisioned < 0 || !provisioned) { provisioned = 0; }
        if (provisionable < 0 || !provisionable) {
            if (!provisionable && server.disk_pool_size_bytes) { provisionable = server.disk_pool_size_bytes; }
            else { provisionable = 0; }
        }

        var pieData = [
            {label: 'Provisioned', value: provisioned },
            {label: 'Provisionable', value: provisionable },
        ];
        return pieData;
    },

    drawDiskGraph: function() {
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
        this.drawDiskGraph();
        this.props.server.on('change:memory_provisionable_bytes change:reservation_ratio', this.drawDiskGraph, this);
    },

    componentWillUnmount: function() {
        this.props.server.off('change:memory_provisionable_bytes change:reservation_ratio', this.drawDiskGraph);
    },

    render: function() {
        var diameter = parseInt(this.props.diameter);
        var percentmTop = (-(diameter/2) - 9) + 'px';
        var server = this.props.server.toJSON();

        var provisioned = server.disk_pool_size_bytes - (server.unreserved_disk * 1048576);
        var total = server.disk_pool_size_bytes;

        if (provisioned < 0 || !provisioned) { provisioned = 0; }
        if (total < 0 || !server.unreserved_disk) { total = 0; } 

        var util_percent = (provisioned && total > 0) ? Math.round(provisioned / total * 100) : 0;

        var pctSize, labelSize;
        if (diameter > 100) {
            pctSize = '18px';
            labelSize = '10px';
            percentmTop = parseInt(percentmTop) - 2 + 'px';
        }

        return <div className="server-disk-utilization-circle" style={ {width: diameter, height: diameter} }>
            <div className="graph epoch" style={ {width: diameter, height: diameter} }></div>
            <div className="percent" style={ {'fontSize': pctSize, 'marginTop': percentmTop}}>
                <strong style={ {'fontSize': labelSize} }>UTILIZATION</strong> {util_percent}%
            </div>
        </div>;
    }
});

module.exports = ServerMemoryUtilizationCircle;
