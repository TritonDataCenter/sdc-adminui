/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var BackboneMixin = require('../../_backbone-mixin');
var ServerDiskUtilizationCircle = require('./disk-utilization-circle');

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

        var total = server.disk_pool_size_bytes;

        var usedInGB = 0;

        Object.keys(server.vms).forEach(function(uuid) {
            var vm = server.vms[uuid];
            usedInGB += vm.quota;
        });

        var usedBytes = usedInGB * 1024 * 1024 * 1024;

        var provisionable = total - usedBytes;


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
                    <div className="value">{provisionable/1024/1024/1024} GB</div>
                    <div className="title">Provisionable</div>
                </div>
                <div className="provisioned-disk">
                    <div className="value">{usedBytes/1024/1024/1024} GB</div>
                    <div className="title">Provisioned</div>
                </div>

                <div className="total-disk">
                    <div className="value">{server.disk_pool_size_bytes/1024/1024/1024} GB</div>
                    <div className="title">Total</div>
                </div>
            </div>
        </div>;
    }
});

module.exports = ServerDiskOverview;
