/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var ServerMemoryUtilizationCircle = require('./memory-utilization-circle');
var BackboneMixin = require('../../_backbone-mixin');
var utils = require('../../../lib/utils');

var ServerMemoryOverview = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.server];
    },
    render: function() {
        var server = this.props.server.toJSON();

        server.memory_total_provisionable_bytes = (server.memory_total_bytes * (1-server.reservation_ratio));
        server.memory_provisionable = utils.getReadableSize(server.memory_provisionable_bytes);
        server.memory_reserved = utils.getReadableSize(server.reservation_ratio * server.memory_total_bytes);
        server.memory_unreserved = utils.getReadableSize((1-server.reservation_ratio) * server.memory_total_bytes);
        server.memory_total = utils.getReadableSize(server.memory_total_bytes);
        server.memory_provisioned = utils.getReadableSize(server.memory_total_provisionable_bytes - server.memory_provisionable_bytes);
        if (server.memory_provisioned_gb <= 0) {
            server.memory_provisioned_gb = 0;
        }
        return <div className="memory-overview">
            <div className="row">
                <div className="col-sm-12">
                    <h5 className="overview-title">Memory Utilization</h5>
                </div>
            </div>
            <div className="row">
                <div className="server-memory-utilization-container">
                    <ServerMemoryUtilizationCircle diameter="120px" inner="38" server={this.props.server} />
                </div>
                <div className="provisionable-memory">
                    <div className="value">{server.memory_provisionable.value + ' ' + server.memory_provisionable.measure}</div>
                    <div className="title">Provisionable</div>
                </div>
                <div className="provisioned-memory">
                    <div className="value">{server.memory_provisioned.value + ' ' + server.memory_provisioned.measure}</div>
                    <div className="title">Provisioned</div>
                </div>
                <div className="reserved-memory">
                    <div className="value">{server.memory_reserved.value + ' ' + server.memory_reserved.measure}</div>
                    <div className="title">Reserved</div>
                </div>
                <div className="unreserved-memory">
                    <div className="value">{server.memory_unreserved.value + ' ' + server.memory_unreserved.measure}</div>
                    <div className="title">Unreserved</div>
                </div>
                <div className="total-memory">
                    <div className="value">{server.memory_total.value + ' ' + server.memory_total.measure}</div>
                    <div className="title">Total</div>
                </div>
            </div>
        </div>;
    }
});

module.exports = ServerMemoryOverview;
