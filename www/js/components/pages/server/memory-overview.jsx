/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
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

        var provisionable = utils.getReadableSize(server.memory_provisionable_bytes);
        var provisioned = utils.getReadableSize((1-server.reservation_ratio) * server.memory_total_bytes -
                                                server.memory_provisionable_bytes);
        var reserved = utils.getReadableSize(server.reservation_ratio * server.memory_total_bytes);
        var unreserved = utils.getReadableSize((1-server.reservation_ratio) * server.memory_total_bytes);
        var total = utils.getReadableSize(server.memory_total_bytes);

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
                    <div className="value">{provisionable.value + ' ' + provisionable.measure}</div>
                    <div className="title">
                        <a data-toggle="tooltip" data-placement="bottom" data-trigger="hover"
                            title="Amount of memory currently available for provisioning.">
                            Provisionable
                        </a>
                    </div>
                </div>
                <div className="provisioned-memory">
                    <div className="value">{provisioned.value + ' ' + provisioned.measure}</div>
                    <div className="title">
                        <a data-toggle="tooltip" data-placement="bottom" data-trigger="hover"
                            title="Amount of memory already committed to provisioned instances.">
                            Provisioned
                        </a>
                    </div>
                </div>
                <div className="reserved-memory">
                    <div className="value">{reserved.value + ' ' + reserved.measure}</div>
                    <div className="title">
                        <a data-toggle="tooltip" data-placement="bottom" data-trigger="hover"
                            title="Amount of memory reserved for system use.">
                            Reserved
                        </a>
                    </div>
                </div>
                <div className="unreserved-memory">
                    <div className="value">{unreserved.value + ' ' + unreserved.measure}</div>
                    <div className="title">
                        <a data-toggle="tooltip" data-placement="bottom" data-trigger="hover"
                            title="Total DRAM minus memory reserved for system use.">
                            Unreserved
                        </a>
                    </div>
                </div>
                <div className="total-memory">
                    <div className="value">{total.value + ' ' + total.measure}</div>
                    <div className="title">
                        <a data-toggle="tooltip" data-placement="bottom" data-trigger="hover"
                            title="Total DRAM on the server.">
                            Total
                        </a>
                    </div>
                </div>
            </div>
        </div>;
    }
});

module.exports = ServerMemoryOverview;
