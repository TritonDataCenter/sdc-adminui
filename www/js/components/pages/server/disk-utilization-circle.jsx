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
        var server = this.props.server.toJSON();

        var usedInGB = 0;

        Object.keys(server.vms).forEach(function(uuid) {
            var vm = server.vms[uuid];
            usedInGB += vm.quota;
        });

        var usedBytes = usedInGB * 1024 * 1024 * 1024;

        var provisionable = this.props.server.getProvisionableValue();
        if (provisionable < 0) {
            provisionable = 0;
        }

        var pieData = [
            {label: 'Used', value: usedBytes },
            {label: 'Provisionable', value: provisionable },
        ];
        return pieData;
    },
    drawCircle: function() {
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
        this.drawCircle();
        this.props.server.on('change:memory_provisionable_bytes change:reservation_ratio', this.drawCircle, this);
    },
    componentWillUnmount: function() {
        this.props.server.off('change:memory_provisionable_bytes change:reservation_ratio', this.drawCircle);
    },
    render: function() {
        var diameter = parseInt(this.props.diameter);
        var percentmTop = (-(diameter/2) - 9) + 'px';
        var server = this.props.server.toJSON();

        var total = server.disk_pool_size_bytes;
        var usedInGB = 0;

        Object.keys(server.vms).forEach(function(uuid) {
            var vm = server.vms[uuid];
            usedInGB += vm.quota;
        });

        var usedBytes = usedInGB * 1024 * 1024 * 1024;

        var util_percent = Math.round(usedBytes / total * 100);
        if (util_percent <= 0) {
            util_percent = 0;
        }
        var pctSize, labelSize;
        if (parseInt(this.props.diameter) > 100) {
            pctSize = '18px';
            labelSize = '10px';
            percentmTop = parseInt(percentmTop) - 2 + 'px';
        }

        return <div className="server-disk-utilization-circle" style={ {width: this.props.diameter, height: this.props.diameter} }>
            <div className="graph epoch" style={ {width: this.props.diameter, height: this.props.diameter} }></div>
            <div className="percent" style={ { 'font-size': pctSize, 'margin-top': percentmTop}}>
                <strong style={ { 'font-size':labelSize }}>UTILIZATION</strong> {util_percent}%
            </div>
        </div>;
    }
});

module.exports = ServerMemoryUtilizationCircle;
