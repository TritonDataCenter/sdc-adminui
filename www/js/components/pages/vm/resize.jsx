/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var VMModel = require('../../../models/vm');
var PackageSelect = require('../../package-select');

var ResizeVm = React.createClass({
    propTypes: {
        vmUuid: React.PropTypes.string.isRequired,
        onResizeJobCreated: React.PropTypes.func.isRequired
    },
    getInitialState: function() {
        return {};
    },
    _onSelectPackage: function(p) {
        this.setState({selected: p});
    },
    _onResize: function() {
        var self = this;
        var vm = new VMModel({uuid: this.props.vmUuid});
        var pkg = this.state.selected;
        var values = {};
        values.billing_id = pkg.uuid;
        values.package_name = pkg.name;
        values.package_version = pkg.version;
        values.cpu_cap = pkg.cpu_cap;
        values.max_lwps = pkg.max_lwps;
        values.max_swap = pkg.max_swap;
        // quota value needs to be in GiB
        values.quota = pkg.quota;
        if (values.quota) {
            values.quota = Math.ceil(Number(values.quota) / 1024);
        }

        values.vcpus = pkg.vcpus;
        values.zfs_io_priority = pkg.zfs_io_priority;
        values.ram = pkg.max_physical_memory;
        vm.update(values, function(job, err) {
            if (err) {
                self.setState({error: err});
            } else {
                self.props.onResizeJobCreated(job);
            }
        });
    },
    render: function() {
        var p = this.state.selected;
        var e = this.state.error;
        return (
            <div className="modal in" style={{display:'block'}} id="reisze-vm">
                <div className="modal-backdrop in"></div>
                <div className="modal-dialog">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h2 className="modal-title">Change Container Package</h2>
                        </div>
                        <div className="modal-body">
                            { e ? <div className="alert alert-danger">
                                <h6>{e.message}</h6>
                                {e.errors ?
                                    <ul>
                                    { e.errors.map(function(e) { return <li>{e.message}</li>; }) }
                                    </ul>
                                :null}
                            </div> : null }
                            <div>
                                <p>Resize this Containers to package: </p>
                                <PackageSelect onChange={this._onSelectPackage} />
                            </div>
                            { p ?
                            <div className="package-preview">
                                <div className="title">
                                    <span name="name">{p.name}</span><span name="version">{p.version}</span>
                                </div>
                                <strong>Memory</strong> <span name="max_physical_memory">{p.max_physical_memory}</span> MB<br />
                                <strong>Swap</strong> <span name="max_swap">{p.max_swap}</span> MB<br />
                                <strong>V-CPUs</strong> <span name="vcpus">{p.vcpus}</span><br />
                                <strong>Disk Quota</strong> <span name="quota">{p.quota}</span><br />
                                <strong>Disk IO Priority</strong> <span name="zfs_io_priority">{p.zfs_io_priority}</span>
                            </div> : null }
                        </div>
                        <div className="modal-footer">
                            <button onClick={this.props.onCancel} className="btn btn-default">Close</button>
                            <button onClick={this._onResize} disabled={!this.state.selected} className="btn btn-primary">Resize to selected package</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

});

module.exports = ResizeVm;
