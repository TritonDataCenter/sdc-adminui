/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');
var ServerDiskUtilizationCircle = require('./disk-utilization-circle');
var utils = require('../../../lib/utils');

var ServerDiskOverview = React.createClass({
    mixins: [BackboneMixin],
    getBackboneModels: function() {
        return [this.props.server];
    },
    render: function() {
        var server = this.props.server.toJSON();
        if (!server.vms) {
            return null;
        }

        var provisioned = server.disk_pool_size_bytes - (server.unreserved_disk * 1048576);
        var provisionable = server.unreserved_disk * 1048576;
        var total = server.disk_pool_size_bytes;
        
        if (provisioned < 0 || !provisioned) { provisioned = 0; }
        if (provisionable < 0 || !provisionable) {
            if (!provisionable && server.disk_pool_size_bytes) { provisionable = server.disk_pool_size_bytes; }
            else { provisionable = 0; }
        }
        if (total < 0 || !provisionable) { total = 0; }

        var provisioned = utils.getReadableSize(provisioned);
        var provisionable = utils.getReadableSize(provisionable);
        var total = utils.getReadableSize(server.disk_pool_size_bytes);

        return <div className="disk-overview">
            <div className="row">
                <div className="col-sm-12">
                    <h5 className="overview-title">Disk Utilization</h5>
                </div>
            </div>
            <div className="row">
                <div className="server-disk-utilization-container">
                    <ServerDiskUtilizationCircle diameter="120px" inner="38" server={this.props.server} />
                </div>
                <div className="provisionable-disk">
                    <div className="value">{provisionable.value + ' ' + provisionable.measure}</div>
                    <div className="title">Provisionable</div>
                </div>
                <div className="provisioned-disk">
                    <div className="value">{provisioned.value + ' ' + provisioned.measure}</div>
                    <div className="title">Provisioned</div>
                </div>

                <div className="total-disk">
                    <div className="value">{total.value + ' ' + total.measure}</div>
                    <div className="title">Total</div>
                </div>
            </div>
        </div>;
    }
});

module.exports = ServerDiskOverview;
