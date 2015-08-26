/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';

var React = require('react');
var cx = require('classnames');
var moment = require('moment');
var _ = require('underscore');

var api = require('../../../request');
var VMModel = require('../../../models/vm');


var JobProgress = require('../../job-progress');
var UserTile = require('../../user-tile');
var FirewallToggleButton = require('./fw-toggle-button');


var BB = require('../../bb.jsx');

// These are views that are still BB views
var OwnerChange = require('./vm-change-owner');
var FWRulesList = require('./fwrules-list');
var FWRulesForm = require('./fwrules-form');
var SnapshotsList = require('./snapshots');
var NicsList = require('./nics');


var Metadata =  require('./metadata');
var Notes = require('../../notes');
var ResizeVm = require('./resize');
var JobsList = require('../../jobs-list');

var ReprovisionVm = require('./reprovision');
var RenameVm = require('./rename');

var VMPage = React.createClass({
    statics: {
        sidebar: 'vms',
        url: function (props) {
            return _.str.sprintf('/vms/%s', props.vmUuid);
        }
    },
    getInitialState: function () {
        return {};
    },
    reloadData: function () {
        var uuid = this.props.vmUuid;
        api.get('/api/page/vm').query({uuid: uuid}).end(function (res) {
            if (res.ok) {
                this.setState(res.body);
            }
            if (res.notFound) {
                this.setState({notFound: true});
            }
        }.bind(this));
    },
    componentDidMount: function () {
        this.fwrulesList = new FWRulesList({
            app: this.props.adminui,
            vm: new VMModel({uuid: this.props.vmUuid})
        });
        this.fwrulesList.on('itemview:edit:rule', function (iv) {
            iv.$el.addClass('editing');
            this.fwrulesForm = new FWRulesForm({model: iv.model });
            this.setState({ editing: 'fwrule' });

            this.fwrulesForm.on('close', function () {
                this.setState({ editing: false });
                iv.$el.removeClass('editing');
            }, this);

            this.fwrulesForm.on('rule:saved', function () {
                this.setState({ editing: false });
                this.fwrulesList.collection.fetch();
            }, this);
        }, this);

        this.reloadData();
    },
    render: function () {
        console.log('[vm] state', this.state);

        if (this.state.notFound) {
            return <div id="page-vm">
                <div className="page-header">
                    <h2>Virtual Machine Not Found</h2>
                </div>
                <p>The Virtual Machine with ID <code>{this.props.vmUuid}</code> could not be found.</p>
            </div>;
        }

        if (!this.state.vm) {
            return null;
        }

        var adminui = this.props.adminui;

        var image = this.state.image;
        var server = this.state.server;
        var pkg = this.state.package;
        var vm = this.state.vm;

        var quota = 0;
        if (vm.brand === 'kvm') {
            vm.disks.forEach(function (k) {
                if (k.size && typeof(k.size) === 'number' && k.size > 0) {
                    quota = quota + (k.size/1024); // disk.size is in mib
                }
            });
        } else {
            quota = vm.quota;
        }

        var ips;
        if (vm.nics.length) {
            ips = vm.nics.map(function (nic) {
                return nic.ip;
            }).join(' ');
        } else {
            ips = vm.nics = '';
        }

        return <div id="page-vm">
            { this.state.currentJob ? <JobProgress onClose={this._handleJobModalClose} job={this.state.currentJob} /> : null }
            { this.state.editing === 'package' ? <ResizeVm vmUuid={this.state.vm.uuid} onCancel={this._handleResizeVmCancel} onResizeJobCreated={this._handleResizeJobCreated} /> : null }
            { this.state.editing === 'reprovision' ? <ReprovisionVm uuid={this.state.vm.uuid} onJobCreated={this._handleReprovisionJobCreated} onReprovisionCancel={this._handleReprovisionCancel} /> : null }
            { this.state.editing === 'alias' ? <RenameVm uuid={this.state.vm.uuid} onJobCreated={this._handleRenameJobCreated} onCancel={this._handleRenameVmCancel} /> : null }

            <div className="page-header">
                <div className="resource-status"><span className={'vm-state ' + vm.state}>{vm.state}</span></div>
                <h1>
                    <span className="vm-alias">{vm.alias || vm.uuid}</span>&nbsp;
                    <small className="uuid vm-uuid selectable">{vm.uuid}</small>&nbsp;
                    {vm.tags.smartdc_type ? <span className={'type ' + vm.tags.smartdc_type}>{vm.tags.smartdc_type}</span> : null }
                    {vm.docker ? <span className="type docker">docker</span> : null }
                </h1>
            </div>

            {adminui.user.role('operators') ?
            <div className="actions">
                <div className="notes-component-container"><Notes item={vm.uuid} /></div>
                <div className="btn-group">
                    <a className="btn dropdown-toggle btn-info" data-toggle="dropdown" href="#">Actions <span className="caret"></span></a>

                    <ul className="dropdown-menu dropdown-menu-right">
                        <li className={cx({disabled: vm.state === 'running'})}><a onClick={this._handleStartVm} className="start">Start</a></li>
                        <li className={cx({disabled: vm.state !== 'running'})}><a onClick={this._handleStopVm} className="stop">Stop</a></li>
                        <li className={cx({disabled: vm.state !== 'running'})}><a onClick={this._handleReobotVm} className="reboot">Reboot</a></li>
                        <li className="divider"></li>
                        <li><a onClick={this._handleRenameVm} className="rename">Rename Alias</a></li>

                        { vm.brand !== 'kvm' ?
                            [
                                <li key="1" className="divider"></li>,
                                <li key="2"><a onClick={this._handleReprovisionVm} className="reprovision">Reprovision</a></li>,
                                <li key="3"><a onClick={this._handleResizeVm} className="resize">Resize</a></li>
                            ]
                        : null }

                        <li className="divider"></li>
                        <li><a onClick={this._handleDeleteVm} className="delete">Delete</a></li>
                    </ul>
                </div>
            </div> : null }
            
            <section className="vms-details">
                <div className="row">
                    <div className="col-md-9">
                        <table className="overview">
                            <tr>
                                <th>Name</th>
                                <td>
                                    <span className="alias">
                                        <form className="form-inline"></form>
                                        <span className="value vm-alias">{vm.alias || vm.uuid}</span>
                                    </span>

                                    <span className="vm-uuid selectable">{vm.uuid}</span>
                                </td>
                            </tr>

                            <tr>
                                <th>Memory &amp; Swap</th>
                                <td>
                                    <span className="vm-memory">{vm.ram}</span> MB / <span className="vm-swap">{vm.max_swap}</span> MB
                                </td>
                            </tr>

                            <tr>
                                <th>Disk</th>
                                <td>
                                    <span className="vm-disk-quota">
                                    {vm.brand === 'kvm' ?
                                        <div className="vm-disk-quota-kvm">
                                            Total: {quota} GB
                                            <span className="details">
                                                [<span className="img">IMG: {vm.disks[0].image_size/1024} GB</span>{vm.disks[1] ? + <span className="pkg">PKG: {vm.disks[1].size / 1024} GB</span> : '' }]
                                            </span>
                                        </div>
                                    : <div>
                                        {quota} GB
                                        </div>
                                    }
                                    </span>
                                </td>
                            </tr>

                            <tr>
                              <th>IP Addresses</th>
                              <td>
                                <span className="vm-ips">{ips}</span>
                              </td>
                            </tr>

                            <tr>
                                <th>Image</th>
                                    {image ?
                                        <td>
                                            <a href={'/images/' + image.uuid} onClick={function (e) {
                                                e.preventDefault();
                                                adminui.router.showImage(image.uuid);
                                            }} className="image-name-version">{image.name} {image.version}</a>
                                            <span className="image-uuid selectable">{image.uuid}</span>
                                        </td>
                                        :
                                        <td><span className="image-name-version error">Error retrieving Image information</span></td>
                                    }
                            </tr>

                            <tr>
                                <th>Server</th>
                                <td>
                                    {server && vm.server_uuid &&
                                        <a href={'/servers/' + server.uuid} onClick={function (e) {
                                            e.preventDefault();
                                            adminui.router.showServer(vm.server_uuid);
                                        }} className="server-hostname">{server.hostname}</a>
                                    }
                                    <span className="server-uuid selectable">{vm.server_uuid}</span>
                                </td>
                            </tr>

                            <tr>
                                <th>Package</th>
                                <td>
                                    {pkg ? <a className="package" href={'/packages/' + vm.billing_id} onClick={function (e) {
                                        e.preventDefault();
                                        adminui.router.showPackage(vm.billing_id);
                                    }}>
                                        <span className="package-name">{pkg.name}</span> &nbsp;
                                        <span className="package-version">{pkg.version}</span>
                                    </a> : <span>N/a</span>}
                                    <span className="billing-id selectable">{vm.billing_id}</span>
                                </td>
                            </tr>

                            {vm.datasets.length ?
                                <tr>
                                    <th>Datasets</th>
                                    <td className="datasets">
                                        {
                                            vm.datasets.map(function (d) {
                                                return <span className="selectable">{d}</span>;
                                            })
                                         }
                                    </td>
                                </tr>
                            : null}
                            <tr>
                                <th>Created</th>
                                <td>
                                    <span className="created">
                                        {vm.create_timestamp && moment(vm.create_timestamp).utc().format('D MMMM, YYYY HH:mm:ss z')}
                                    </span>
                                </td>
                            </tr>
                            <tr>
                                <th>Last Modified</th>
                                <td>
                                    <span className="last-modified">
                                        {vm.last_modified && moment(vm.last_modified).utc().format('D MMMM, YYYY HH:mm:ss z')}
                                    </span>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <div className="col-md-3">
                        <div className="user-tile-icon">
                            <i className="fa fa-user"></i>
                        </div>
                        {
                            adminui.user.role('operators') &&
                                <a onClick={this._handleChangeOwner} className="change-owner"><i className="fa fa-pencil"></i> change</a>
                        }
                        <div className="user-tile-container">
                            <UserTile uuid={vm.owner_uuid} onUserDetails={
                                function (user) { adminui.vent.trigger('showcomponent', 'user', {uuid: user.uuid }); }
                                } />
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="row">
                    <div className="col-md-12">
                        <div className="nics-region">
                            <BB view={new NicsList({vm: new VMModel(this.state.vm)})} />
                        </div>
                    </div>
                </div>
            </section>


            <section>
                <div className="row">
                    <div className="col-md-12">
                        <div className="snapshots">
                            <BB view={new SnapshotsList({vm: new VMModel(this.state.vm)})} />
                        </div>
                    </div>
                </div>
            </section>

            <section className="customer-metadata">
                <div className="row">
                    <div className="col-md-12">
                        <h3>
                            Customer Metadata
                            { adminui.user.role('operators') && this.state.editing !== 'customer_metadata' ?
                                <div className="actions"><button onClick={this._handleCustomerMetadataEdit} className="btn-link btn-xs edit-customer-metadata"><i className="fa fa-pencil"></i> Edit Metadata</button></div>
                            : null }
                        </h3>
                        <div className="customer-metadata-region">
                            <Metadata
                                onSave={this._handleCustomerMetadataSave}
                                onCancel={this._handleCustomerMetadataEditCancel}
                                editing={this.state.editing === 'customer_metadata'}
                                metadata={vm.customer_metadata} />
                        </div>
                    </div>
                </div>
            </section>


            <section className="internal-metadata-and-tags">
                <div className="row">
                    <div className="col-md-6">
                        <h3>Internal Metadata
                            { adminui.user.role('operators') && this.state.editing !== 'internal_metadata' ?
                            <div className="actions">
                                <button onClick={this._handleInternalMetadataEdit} className="btn-link btn-xs edit-internal-metadata"><i className="fa fa-pencil"></i> Edit Metadata</button>
                            </div> : null }
                        </h3>
                        <div className="internal-metadata-region">
                            <Metadata
                                onSave={this._handleInternalMetadataSave}
                                onCancel={this._handleInternalMetadataEditCancel}
                                editing={this.state.editing === 'internal_metadata'}
                                metadata={vm.internal_metadata} />
                        </div>
                    </div>
                    <div className="col-md-6">
                        <h3>Tags
                            { adminui.user.role('operators') && this.state.editing !== 'tags' ?
                            <div className="actions">
                                <button onClick={this._handleTagsEdit} className="btn-link btn-xs edit-tags"><i className="fa fa-pencil"></i> Edit Tags</button>
                            </div> : null }
                        </h3>
                        <div className="tags-container">
                            <Metadata
                                onSave={this._handleTagsSave}
                                onCancel={this._handleTagsEditCancel}
                                editing={this.state.editing === 'tags'}
                                metadata={vm.tags} />
                        </div>
                    </div>
                </div>
            </section>

            {
                (vm.brand !== 'kvm' || (vm.brand === 'kvm' && server.current_platform && Number(server.current_platform.slice(0,8) > 20140314))) ?
                <section className="fwrules">
                    <div className="row">
                        <div className="col-md-12">
                            <h3>
                                Firewall
                                { adminui.user.role('operators') ?
                                    <div className="actions">
                                        <div className="firewall-toggle-button">
                                            <FirewallToggleButton initialValue={vm.firewall_enabled} onToggle={this._handleFirewallToggle} />
                                        </div>
                                        <a onClick={this._handleAddFirewallRule} className="btn btn-info btn-sm show-fwrules-form"><i className="fa fa-plus"></i> Create Firewall Rule</a>
                                    </div> : null
                                }
                            </h3>
                            <div className="fwrules-form-region">
                                {this.state.editing === 'fwrule' ? <BB view={this.fwrulesForm} /> : null }
                            </div>
                            <div className="fwrules-list-region">
                                <BB view={this.fwrulesList} />
                            </div>
                        </div>
                    </div>
                </section>
            : null }

            <section>
              <div className="row">
                <div className="col-md-12">
                  <h3>Jobs</h3>
                  <div className="jobs-list-region"><JobsList perPage={1000} params={ {vm_uuid: vm.uuid} }/></div>
                </div>
              </div>
            </section>
        </div>;
    },
    _handleStartVm: function () {
        var vm = new VMModel({uuid: this.state.vm.uuid});
        var self = this;
        vm.start(function (job, err) {
            if (job) {
                self.setState({currentJob: job});
            }
        });
    },
    _handleStopVm: function () {
        if (window.confirm('Are you sure you want to shut down this VM?')) {
            var vm = new VMModel({uuid: this.state.vm.uuid});
            var self = this;
            vm.stop(function (job, err) {
                if (job) {
                    self.setState({currentJob: job});
                }
            });
        }
    },
    _handleRenameVm: function () {
        this.setState({editing: 'alias'});
    },
    _handleRenameVmCancel: function () {
        this.setState({editing: null});
    },
    _handleRenameJobCreated: function (job) {
        this.setState({currentJob: job, editing: null});
    },

    _handleAddFirewallRule: function () {
        this.fwrulesForm = new FWRulesForm({ vm: new VMModel(this.state.vm) });

        this.fwrulesForm.on('close', function () {
            this.setState({ editing: false });
        }, this);

        this.fwrulesForm.on('rule:saved', function () {
            this.setState({ editing: false });
            this.fwrulesList.collection.fetch();
        }, this);

        this.setState({ editing: 'fwrule' });
    },


    _handleReobotVm: function () {
        if (window.confirm('Are you sure you want to reboot this VM?')) {
            var vm = new VMModel({uuid: this.state.vm.uuid});
            var self = this;
            vm.reboot(function (job, err) {
                if (job) {
                    self.setState({currentJob: job});
                }
            });
        }
    },
    _handleResizeVm: function () {
        this.setState({editing: 'package'});
    },
    _handleResizeVmCancel: function () {
        this.setState({editing: null});
    },
    _handleResizeJobCreated: function (job) {
        this.setState({currentJob: job});
    },
    _handleDeleteVm: function () {
        if (window.confirm('Are you sure you want to delete this VM?')) {
            var vm = new VMModel({uuid: this.state.vm.uuid});
            var self = this;
            vm.del(function (job, err) {
                if (job) {
                    self.setState({currentJob: job});
                }
            });
        }
    },
    _handleChangeOwner: function () {
        var vm = new VMModel({uuid: this.state.vm.uuid});
        var changeOwner = new OwnerChange({
            app: this.props.adminui,
            vm: vm
        });
        changeOwner.show();
    },
    _handleReprovisionVm: function () {
        this.setState({editing: 'reprovision'});
    },
    _handleReprovisionCancel: function () {
        this.setState({editing: false});
    },
    _handleReprovisionJobCreated: function (job) {
        this.setState({currentJob: job, editing: false});
    },

    _handleJobModalClose: function () {
        this.setState({
            editing: false,
            currentJob: null
        });
        this.reloadData();
    },


    /** Tags handlers **/
    _handleTagsEdit: function () {
        this.setState({editing: 'tags'});
    },
    _handleTagsEditCancel: function () {
        this.setState({editing: false});
    },
    _handleTagsSave: function (data) {
        var vm = new VMModel({uuid: this.state.vm.uuid});
        var self = this;
        vm.update({tags: data}, function (job, err) {
            if (job) {
                self.setState({currentJob: job});
                job.on('finished', function () {
                    self.fwrulesList.refresh();
                });
            }
        });
    },


    /** InternalMetadata handlers */
    _handleInternalMetadataEdit: function () {
        this.setState({editing: 'internal_metadata'});
    },
    _handleInternalMetadataEditCancel: function () {
        this.setState({editing: false});
    },
    _handleInternalMetadataSave: function (data) {
        var vm = new VMModel({uuid: this.state.vm.uuid});
        var self = this;
        vm.update({internal_metadata: data}, function (job, err) {
            if (job) {
                self.setState({currentJob: job});
            }
        });
    },




    /** Customer Metadata Edit Handlers */

    _handleCustomerMetadataEdit: function () {
        this.setState({editing: 'customer_metadata'});
    },
    _handleCustomerMetadataSave: function (data) {
        var vm = new VMModel({uuid: this.state.vm.uuid});
        var self = this;
        vm.update({customer_metadata: data}, function (job, err) {
            if (job) {
                self.setState({currentJob: job});
            }
        });
    },
    _handleCustomerMetadataEditCancel: function () {
        this.setState({editing: false});
    },

    /* Firewall */
    _handleFirewallToggle: function (value) {
        var vm = new VMModel(this.state.vm);
        var self = this;
        vm.update({firewall_enabled: value}, function (job) {
            self.setState({currentJob: job});
        });
    }
});

module.exports = VMPage;
