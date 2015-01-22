/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";


var adminui = require('../adminui');
var _ = require('underscore');
var api = require('../request');
var React = require('react');
var cx = React.addons.classSet;

var ServerLink = require('./server-link');
var ImageLnk = require('./image-link');
var UserLink = require('./user-link');

var Modal = require('./modal');
var Vms = require('../models/vms');
var JSONExport = require('./json-export');
var BatchJobProgress = require('./batch-job-progress');
var BatchJobConfirm = require('./batch-job-confirm');

var MetadataForm = require('./pages/vm/metadata');
var MetadataModal = React.createClass({
    propTypes: {
        type: React.PropTypes.string.isRequired
    },
    render: function() {
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
    componentDidMount: function() {
        this._requests = [];
        this.props.collection.on('request', this._onRequest, this);
        this.props.collection.on('sync', this._onSync, this);
    },
    componentWillUnmount: function() {
        this._requests.map(function(r) {
            r.abort();
        });
    },
    getInitialState: function() {
        return {
            loading: true,
            selected: []
        };
    },
    _onRequest: function() {
        this.setState({loading: true});
    },
    _onSync: function() {
        this.setState({loading: false});
    },
    _handleExport: function(e) {
        e.preventDefault();
        var vms = new Vms(null, {params: this.props.collection.params});
        vms.exportGroupedByCustomer().done(function(exported) {
            this.setState({'exported': exported});
        }.bind(this));
    },

    _HandleDismissExport: function() {
        this.setState({'exported': false});
    },

    _handleLoadMore: function() {
        if (this.props.collection.hasNext()) {
            this.props.collection.next();
            this._requests.push(this.props.collection.fetch({remove: false}));
        }
    },

    _handleLoadAll: function() {
        this.props.collection.pagingParams.perPage = null;
        this._requests.push(this.props.collection.fetch({remove: false}));
    },
    _handleCloseJobs: function() {
        this.setState({jobs: null});
    },
    _handleClearSelection: function() {
        this.setState({selected: []});
    },
    _handleCloseBatchJobConfirm: function() {
        this.setState({confirm: null});
    },



    renderActionBar: function() {
        var numSelectedMachines = this.state.selected.length;
        return <div className="actionbar row">
            <div className="actionbar-items col-sm-4">
                {numSelectedMachines} Virtual Machine{numSelectedMachines > 1 ? 's' : ''} selected
            </div>
            <div className="actionbar-actions col-sm-6">
                <a data-action="reboot" onClick={this._handleAction}><i className="fa fa-fw fa-refresh" /> Reboot</a>
                <a data-action="stop" onClick={this._handleAction}><i className="fa fa-fw fa-power-off" /> Stop</a>
                <a data-action="start" onClick={this._handleAction}><i className="fa fa-fw fa-power-off" /> Start</a>
                <a data-action="apply-tags" data-type="tags" onClick={this._handleApplyMetadata}><i className="fa fa-fw fa-tag" /> Tags</a>
                <a data-action="apply-metadata" data-type="customer_metadata" onClick={this._handleApplyMetadata}><i className="fa fa-fw fa-tag" /> Customer Metadata</a>
            </div>
            <div className="actionbar-clear col-sm-2">
                <a onClick={this._handleClearSelection}><i className="fa fa-times" /> Clear</a>
            </div>
        </div>;
    },
    renderVm: function(vmModel) {
        var vm = vmModel.toJSON();
        console.debug('[VmsList] renderVm: ', vm);
        var vmUrl = '/vms/' + vm.uuid;

        var isDocker = vm.docker === true || vm.tags.JPC_tag === 'DockerHost';
        var ips = vm.nics.map(function(n) {
            return n.ip;
        });
        var selected = _.findWhere(this.state.selected, {uuid: vm.uuid});

        return <tr key={vm.uuid} className={ cx({selected: selected})}>
            <td className="select">
                { adminui.user.role('operators') ?
                <input onChange={this._handleSelectVm} data-vm-uuid={vm.uuid} type="checkbox" checked={selected} className="input" />
                : null }
            </td>

            <td className="status">
                <span className={'state ' + vm.state}>{vm.state}</span>
            </td>

            <td className="alias">
                <a href={vmUrl}
                    data-vm-uuid={vm.uuid}
                    onClick={this.navigateToVmPage}>
                    {vm.alias ? vm.alias : vm.uuid }
                </a>
                <span className="uuid"><span className="selectable">{vm.uuid}</span></span>
                { vm.tags.smartdc_type ? <span className={"type " + vm.tags.smartdc_type}>{vm.tags.smartdc_type}</span> : null }
                { isDocker ? <span className="type docker">docker</span> : null }
            </td>
            <td className="owned-by">
                <div className="owner">
                    <UserLink icon company userUuid={vm.owner_uuid} handleClick={this.navigateToOwnerDetailsPage} />
                </div>
            </td>
            <td className="ips">
                {
                    ips.map(function(ip) {
                        return <span className="selectable">{ip}</span>;
                    })
                }
            </td>
            <td className="package-image">
                <div className="server">
                    <ServerLink serverUuid={vm.server_uuid} />
                </div>
                { vm.package_name ?
                    <div className="package">
                        <i className="fa fa-codepen fa-fw"></i>
                        <span className="package-name">{vm.package_name}</span>
                        <span className="package-version">{vm.package_version}</span>
                    </div> : null
                }
                <div className="image">
                    <ImageLnk imageUuid={vm.image_uuid} />
                </div>
            </td>
        </tr>;
    },
    render: function() {
        if (this.state.loading) {
            return <div className="vms-list">
                <div className="zero-state">Retrieving Virtual Machines</div>
            </div>;
        }

        if (! this.props.collection.length) {
            return <div className="zero-state">No Virtual Machines were found matching specified criteria</div>;
        }

        console.log('[VmsList] state', this.state);

        return <div className="vms-list">
                { this.state.selected.length > 0 ? this.renderActionBar() : null }
                { this.state.jobs ? <BatchJobProgress {...this.state.jobs} onClose={this._handleCloseJobs} /> : null }
                { this.state.confirm ? <BatchJobConfirm
                    onClose={this._handleCloseBatchJobConfirm}
                    {...this.state.confirm} /> : null }
                { this.state.metadata ? <MetadataModal type={this.state.metadata.type} onSave={this._handleSaveMetadata} onClose={this._handleCloseMetadata} /> : null}

                <div className="vms-list-header">
                    <div className="title">
                        Showing <span className="current-count">{this.props.collection.length}</span> of <span className="record-count">{this.props.collection.objectCount}</span> Virtual Machines<br/>
                    </div>
                    <div className="actions">
                        {this.props.collection.objectCount ?
                            <a onClick={this._handleExport} className="export">Export (<span className="record-count">{this.props.collection.length}</span>) <i className="fa fa-share-square"></i></a>
                            : null }
                    </div>
                </div>

                <table className="table">
                    <tbody>{ this.props.collection.map(this.renderVm, this) }</tbody>
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

    navigateToVmPage: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();

        var vmModel = this.props.collection.get(e.target.getAttribute('data-vm-uuid'));
        adminui.router.showVm(vmModel.get('uuid'));
    },

    navigateToOwnerDetailsPage: function(user) {
        adminui.vent.trigger('showcomponent', 'user', { user: user });
    },

    _handleApplyMetadata: function(e) {
        var type = e.currentTarget.getAttribute('data-type');
        console.log(this.state.metadata);
        this.setState({metadata: {type: type}});
    },

    _handleSaveMetadata: function(metadata) {
        var self = this;
        var selected = this.state.selected;
        var selectedVmUuids = _.pluck(selected, 'uuid');
        var type = this.state.metadata.type;
        console.log('metadata', this.state.metadata);
        var confirm = {};
        confirm.vms = selected;
        confirm.prompt = "Are you sure you want to apply " + this.state.type + "to "+selectedVmUuids.length + ' Virtual Machine(s)?';
        confirm.action = 'Apply ' + type;
        confirm.onConfirm = function() {
            api.post('/api/vm-metadata').send({
                type: type,
                metadata: metadata,
                vms: selectedVmUuids
            }).end(function(res) {
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
        this.setState({ confirm: confirm, metadata: null});
    },
    _handleCloseMetadata: function() {
        this.setState({metadata: null});
    },

    _handleAction: function(e) {
        var action = e.currentTarget.getAttribute('data-action');
        var selected = this.state.selected;
        var selectedVmUuids = _.pluck(selected, 'uuid');

        var self = this;
        console.log('[VmsList] action', action);
        var confirm = {};
        confirm.vms = selected;

        switch (action) {
            case 'reboot':
                confirm.prompt = "Are you sure you want to reboot "+selectedVmUuids.length + ' Virtual Machine(s)?';
                confirm.action = 'Reboot Virtual Machine(s)';
                confirm.onConfirm = function() {
                    api.post('/api/vm-reboot').send(selectedVmUuids).end(function(res) {
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
                confirm.prompt = "Are you sure you want to start " + selectedVmUuids.length + ' Virtual Machines?';
                confirm.action = 'Stop Virtual Machine(s)';
                confirm.onConfirm = function() {
                    api.post('/api/vm-start').send(selectedVmUuids).end(function(res) {
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
                confirm.action = "Start Virtual Machine(s)";
                confirm.prompt = "Are you sure you want to stop " + selectedVmUuids.length + ' Virtual Machines?';
                confirm.onConfirm = function() {
                    api.post('/api/vm-stop').send(selectedVmUuids).end(function(res) {
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

    _handleSelectVm: function(e) {
        var selected = this.state.selected;
        var uuid = e.target.getAttribute('data-vm-uuid');
        var vm = this.props.collection.get(uuid);
        if (e.target.checked) {
            selected.push(vm.toJSON());
        } else {
             var i = _.findWhere(selected, {uuid: vm.get('uuid')});
             selected.splice(i, 1);
        }
        this.setState({selected: selected});
    }
});

module.exports = VmsList;
