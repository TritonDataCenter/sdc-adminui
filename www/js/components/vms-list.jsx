/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';


var adminui = require('../adminui');
var _ = require('underscore');
var api = require('../request');
var React = require('react');
var cx = require('classnames');

var ServerLink = require('./server-link');
var ImageLnk = require('./image-link');
var UserLink = require('./user-link');

var Modal = require('./modal');
var Vms = require('../models/vms');
var Packages = require('../models/packages');
var JSONExport = require('./json-export');
var BatchJobProgress = require('./batch-job-progress');
var BatchJobConfirm = require('./batch-job-confirm');

var MetadataForm = require('./pages/vm/metadata');
var MetadataModal = React.createClass({
    propTypes: {
        type: React.PropTypes.string.isRequired
    },
    render: function () {
        var title;
        switch(this.props.type) {
            case 'customer_metadata':
                title = "Add Metadata to Virtual Machines";
                break;
            case 'tags':
                title = "Add Tags to Virtual Machines";
                break;
        }
        return (
            <Modal onRequestHide={this.props.onClose} title={title}>
                <div className="modal-body">
                    <MetadataForm editing={true} metadata={{}} onCancel={this.props.onClose} onSave={this.props.onSave} />
                </div>
            </Modal>
        );
    }
});

var VmsList = React.createClass({
    displayName: 'VmsList',
    propTypes: {
        'collection': React.PropTypes.object.isRequired
    },
    componentDidMount: function () {
        this._requests = [];
        this.props.collection.on('request', this._onRequest, this);
        this.props.collection.on('sync', this._onSync, this);
        this.props.collection.on('error', function (model, xhr) {
            var appendedText = '';
            if (xhr.statusText === 'timeout') {
                appendedText = 'Connection timed out - please try again.';
            } else {
                try {
                    appendedText = JSON.parse(xhr.responseText).message;
                } catch (ex) {
                    appendedText = ex;
                }
            }
            adminui.vent.trigger('notification', {
                level: 'error',
                message: 'Failed to fetch vms: ' + appendedText
            });
            this.setState({loading: false});
        }, this);
    },
    componentWillUnmount: function () {
        this.props.collection.off('request');
        this.props.collection.off('sync');

        this._requests.map(function (r) {
            r.abort();
        });
    },
    getInitialState: function () {
        return {
            loading: true,
            selected: [],
            packages: {}
        };
    },
    _onRequest: function () {
        this.setState({loading: true, packages: {}});
    },
    _onSync: function () {
        var self = this;
        this.setState({loading: false});
        var vms = this.props.collection.toJSON();
        var packages = {};
        vms.map(function (vm) {
            var pkgUuid = vm.billing_id;
            if (!packages.hasOwnProperty(pkgUuid)) {
                packages[pkgUuid] = {};
            }
        });
        var packageUuids = Object.keys(packages);
        if (packageUuids.length) {
            var pkglist = new Packages();
            pkglist.params = {uuids: JSON.stringify(packageUuids)};
            pkglist.fetch().done(function () {
                pkglist.toJSON().forEach(function (pkg) {
                    packages[pkg.uuid] = pkg;
                });
                self.setState({packages: packages});
            });
        }
    },
    _handleExport: function (e) {
        e.preventDefault();
        var vms = new Vms(null, {params: this.props.collection.params});
        vms.exportGroupedByCustomer().done(function (exported) {
            this.setState({'exported': exported});
        }.bind(this));
    },
    _HandleDismissExport: function () {
        this.setState({'exported': false});
    },

    _handleLoadMore: function () {
        if (this.props.collection.hasNext()) {
            this.props.collection.next();
            this._requests.push(this.props.collection.fetch({remove: false}));
        }
    },
    _handleLoadAll: function () {
        this.props.collection.pagingParams.perPage = null;
        this._requests.push(this.props.collection.fetch({remove: false}));
    },
    _handleCloseJobs: function () {
        this.setState({jobs: null});
        this.props.collection.fetch();
    },
    _handleClearSelection: function () {
        this.setState({selected: []});
    },
    _handleCloseBatchJobConfirm: function () {
        this.setState({confirm: null});
    },

    renderActionBar: function () {
        var numSelectedMachines = this.state.selected.length;
        return <div className="actionbar row">
            <div className="actionbar-items col-sm-4">
                {numSelectedMachines} Virtual Machine{numSelectedMachines > 1 ? 's' : ''} selected
            </div>
            <div className="actionbar-actions col-sm-6">
                { _.where(this.state.selected, {state: 'running'}).length === this.state.selected.length ?
                <a data-action="reboot" onClick={this._handleAction}><i className="fa fa-fw fa-refresh" /> Reboot</a>
                    : null }
                { _.where(this.state.selected, {state: 'running'}).length === this.state.selected.length ?
                    <a data-action="stop" onClick={this._handleAction}><i className="fa fa-fw fa-power-off" /> Stop</a>
                    : null }
                { _.where(this.state.selected, {state: 'stopped'}).length === this.state.selected.length ?
                    <a data-action="start" onClick={this._handleAction}><i className="fa fa-fw fa-power-off" /> Start</a>
                    : null }
                <a data-action="apply-tags" data-type="tags" onClick={this._handleApplyMetadata}><i className="fa fa-fw fa-tag" /> Tags</a>
                <a data-action="apply-metadata" data-type="customer_metadata" onClick={this._handleApplyMetadata}><i className="fa fa-fw fa-tag" /> Customer Metadata</a>
            </div>
            <div className="actionbar-clear col-sm-2">
                <a onClick={this._handleClearSelection}><i className="fa fa-times" /> Clear</a>
            </div>
        </div>;
    },
    renderVm: function (vmModel) {
        var vm = vmModel.toJSON();
        var vmUrl = '/vms/' + vm.uuid;

        var isDocker = vm.docker === true;
        var isDockerHost = vm.tags.JPC_tag === 'DockerHost';
        var ips = _.pluck(vm.nics, 'ip');
        var selected = _.findWhere(this.state.selected, {uuid: vm.uuid});
        var packageId = vm.billing_id;

        return <tr key={vm.uuid} className={cx({selected: selected})}>
            <td className="select">
                {adminui.user.role('operators') &&
                    <input onChange={this._handleSelectVm} data-vm-uuid={vm.uuid} type="checkbox" checked={selected} className="input" />
                }
            </td>

            <td className="status">
                <span className={'state ' + vm.state}>{vm.state}</span>
            </td>

            <td className="alias">
                <a href={vmUrl}
                    data-vm-uuid={vm.uuid}
                    onClick={this.navigateToVmPage}>
                    {vm.alias ? vm.alias : vm.uuid}
                </a>
                <span className="uuid"><span className="selectable">{vm.uuid}</span></span>
                {vm.tags.smartdc_type && <span className={'type ' + vm.tags.smartdc_type}>{vm.tags.smartdc_type}</span>}
                {isDocker && <span className="type docker">docker</span>}
                {isDockerHost && <span className="type docker">dockerhost</span>}
            </td>
            <td className="owned-by">
                <div className="owner">
                    <UserLink icon company userUuid={vm.owner_uuid} handleClick={this.navigateToOwnerDetailsPage} />
                </div>
            </td>
            <td className="ips">
                {
                    ips.map(function (ip) {
                        return <span key={ip} className="selectable">{ip}</span>;
                    })
                }
            </td>
            <td className="package-image">
                <div className="server">
                    {vm.server_uuid ? <ServerLink serverUuid={vm.server_uuid} /> : null}
                </div>
                {this.state.packages[packageId] &&
                    <div className="package">
                        <i className="fa fa-codepen fa-fw"></i>
                        <span className="package-name">{this.state.packages[packageId].name}</span>
                        <span className="package-version">{this.state.packages[packageId].version}</span>
                    </div>
                }
                <div className="image">
                    {vm.image_uuid ? <ImageLnk imageUuid={vm.image_uuid} /> : null}
                </div>
            </td>
        </tr>;
    },
    render: function () {
        if (this.state.loading) {
            return <div className="vms-list">
                <div className="zero-state">Retrieving Virtual Machines</div>
            </div>;
        }

        if (!this.props.collection.length) {
            return <div className="zero-state">No Virtual Machines were found matching specified criteria</div>;
        }

        return <div className="vms-list">
                {this.state.selected.length > 0 && this.renderActionBar()}
                {this.state.jobs && <BatchJobProgress {...this.state.jobs} onClose={this._handleCloseJobs} />}
                {this.state.confirm && <BatchJobConfirm onClose={this._handleCloseBatchJobConfirm} {...this.state.confirm} />}
                {this.state.metadata && <MetadataModal type={this.state.metadata.type} onSave={this._handleSaveMetadata} onClose={this._handleCloseMetadata} />}

                <div className="vms-list-header">
                    {adminui.user.role('operators') && <div className="select"><input onChange={this._handleSelectAll} type="checkbox" checked={this._isSelectedAll()} className="input" /></div>}
                    <div className="title">
                        Showing <span className="current-count">{this.props.collection.length}</span> of <span className="record-count">{this.props.collection.objectCount}</span> Virtual Machines<br/>
                    </div>
                    <div className="actions">
                        {this.props.collection.objectCount &&
                            <a onClick={this._handleExport} className="export">Export (<span className="record-count">{this.props.collection.length}</span>) <i className="fa fa-share-square"></i></a>
                        }
                    </div>
                </div>

                <table className="table">
                    <tbody>{this.props.collection.map(this.renderVm, this)}</tbody>
                    <caption className="row" style={{visibility: this.state.loading ? 'hidden': 'visible'}}>
                        <div className="col-sm-offset-6 col-sm-4" style={{paddingLeft: 0, paddingRight:0}}>
                        {
                            this.props.collection.objectCount && this.props.collection.objectCount !== this.props.collection.length ?
                            <a onClick={this._handleLoadMore}
                                className="more btn btn-block btn-success"><i className="fa fa-arrow-circle-down"></i> &nbsp; Load More</a>
                            : null
                        }
                        </div>
                        <div className="col-sm-2" style={{paddingLeft: 0}}>
                        {
                            this.props.collection.objectCount && this.props.collection.objectCount !== this.props.collection.length ?
                            <a onClick={this._handleLoadAll}
                                className="all btn btn-block btn-info"><i className="fa fa-arrow-circle-down"></i>
                                    &nbsp; Load All (<span className="record-count">{this.props.collection.objectCount}</span>)</a>
                            : null
                        }
                        </div>
                    </caption>
                </table>
                {
                    this.state.exported ? <div className="export-container">
                        <JSONExport description="Virtual Machines grouped by owner" data={this.state.exported} onRequestHide={this._HandleDismissExport} />
                    </div> : null
                }
            </div>;
    },

    navigateToVmPage: function (e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();

        var vmModel = this.props.collection.get(e.target.getAttribute('data-vm-uuid'));
        adminui.router.showVm(vmModel.get('uuid'));
    },

    navigateToOwnerDetailsPage: function (user) {
        adminui.vent.trigger('showcomponent', 'user', {user: user});
    },

    _handleApplyMetadata: function (e) {
        var type = e.currentTarget.getAttribute('data-type');
        this.setState({metadata: {type: type}});
    },

    _handleSaveMetadata: function (metadata) {
        var self = this;
        var selected = this.state.selected;
        var selectedVmUuids = _.pluck(selected, 'uuid');
        var type = this.state.metadata.type;
        var confirm = {};
        confirm.items = selected;
        confirm.prompt = 'Are you sure you want to apply ' + this.state.type + ' to ' + selectedVmUuids.length + ' Virtual Machine(s)?';
        confirm.action = 'Apply ' + type;
        confirm.onConfirm = function () {
            api.post('/api/vm-metadata').send({
                type: type,
                metadata: metadata,
                vms: selectedVmUuids
            }).end(function (res) {
                self.setState({
                    jobs: {
                        vms: selected,
                        action: 'Apply ' + type,
                        jobs: res.body
                    },
                    confirm: null
                });
            });
        }.bind(this);
        this.setState({confirm: confirm, metadata: null});
    },

    _handleCloseMetadata: function () {
        this.setState({metadata: null});
    },

    _handleAction: function (e) {
        var action = e.currentTarget.getAttribute('data-action');
        var selected = this.state.selected;
        var selectedVmUuids = _.pluck(selected, 'uuid');

        var self = this;
        var confirm = {};
        confirm.items = selected;

        switch (action) {
            case 'reboot':
                confirm.prompt = 'Are you sure you want to reboot ' + selectedVmUuids.length + ' Virtual Machine(s)?';
                confirm.action = 'Reboot Virtual Machine(s)';
                confirm.onConfirm = function () {
                    api.post('/api/vm-reboot').send(selectedVmUuids).end(function (res) {
                        self.setState({
                            jobs: {
                                vms: selected,
                                action: 'Reboot Virtual Machines',
                                jobs: res.body
                            },
                            confirm: null
                        });
                    });
                }.bind(self);
                break;

            case 'start':
                confirm.prompt = 'Are you sure you want to start ' + selectedVmUuids.length + ' Virtual Machine(s)?';
                confirm.action = 'Start Virtual Machine(s)';
                confirm.onConfirm = function () {
                    api.post('/api/vm-start').send(selectedVmUuids).end(function (res) {
                        self.setState({
                            confirm: null,
                            jobs: {
                                vms: selected,
                                action: 'Start Virtual Machines',
                                jobs: res.body
                            }
                        });
                    });
                }.bind(self);
                break;

            case 'stop':
                confirm.action = 'Stop Virtual Machine(s)';
                confirm.prompt = 'Are you sure you want to stop ' + selectedVmUuids.length + ' Virtual Machine(s)?';
                confirm.onConfirm = function () {
                    api.post('/api/vm-stop').send(selectedVmUuids).end(function (res) {
                        self.setState({
                            confirm: null,
                            jobs: {
                                vms: selected,
                                action: 'Stop Virtual Machines',
                                confirm: null,
                                jobs: res.body
                            }
                        });
                    });
                }.bind(self);
                break;
        }
        this.setState({confirm: confirm});
    },

    _handleSelectVm: function (e) {
        var selected = this.state.selected;
        var uuid = e.target.getAttribute('data-vm-uuid');
        var vm = this.props.collection.get(uuid);
        if (e.target.checked) {
            selected.push(vm.toJSON());
        } else {
             var index = _.findIndex(selected, {uuid: uuid});
             selected.splice(index, 1);
        }
        this.setState({selected: selected});
    },

    _handleSelectAll: function (e) {
        this.setState({selected: e.target.checked ? this.props.collection.toJSON() : []});
    },

    _isSelectedAll: function () {
        return this.state.selected.length === this.props.collection.length;
    }
});

module.exports = VmsList;
