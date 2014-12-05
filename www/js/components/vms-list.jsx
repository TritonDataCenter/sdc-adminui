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

var React = require('react');

var ServerLink = require('./server-link');
var ImageLnk = require('./image-link');
var UserLink = require('./user-link');

var Vms = require('../models/vms');
var JSONExport = require('./json-export');



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
        return {loading: true};
    },
    _onRequest: function() {
        this.setState({loading: true});
    },
    _onSync: function() {
        this.setState({loading: false});
    },
    handleExport: function(e) {
        e.preventDefault();
        var vms = new Vms(null, {params: this.props.collection.params});
        vms.exportGroupedByCustomer().done(function(exported) {
            this.setState({'exported': exported});
        }.bind(this));
    },
    handleDismissExport: function() {
        this.setState({'exported': false});
    },
    handleLoadMore: function() {
        if (this.props.collection.hasNext()) {
            this.props.collection.next();
            this._requests.push(this.props.collection.fetch({remove: false}));
        }
    },
    handleLoadAll: function() {
        this.props.collection.pagingParams.perPage = null;
        this._requests.push(this.props.collection.fetch({remove: false}));
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

        return <div className="vms-list">
                <div className="vms-list-header">
                    <div className="title">
                        Showing <span className="current-count">{this.props.collection.length}</span> of <span className="record-count">{this.props.collection.objectCount}</span> Virtual Machines<br/>
                    </div>
                    <div className="actions">
                        {this.props.collection.objectCount ?
                            <a onClick={this.handleExport} className="export">Export (<span className="record-count">{this.props.collection.length}</span>) <i className="fa fa-share-square"></i></a>
                            : null }
                    </div>
                </div>
                <table className="table">
                    <tbody>{ this.props.collection.map(this.renderVm, this) }</tbody>
                    <caption className="row" style={{visibility: this.state.loading ? 'hidden': 'visible'}}>
                        <div className="col-sm-offset-6 col-sm-4" style={{paddingLeft: 0, paddingRight:0}}>
                        {
                            this.props.collection.objectCount && this.props.collection.objectCount !== this.props.collection.length ?
                            <a onClick={this.handleLoadMore}
                                className="more btn btn-block btn-success"><i className="fa fa-arrow-circle-down"></i> &nbsp; Load More</a>
                            : null
                        }
                        </div>
                        <div className="col-sm-2" style={{paddingLeft: 0}}>
                        {
                            this.props.collection.objectCount && this.props.collection.objectCount !== this.props.collection.length ?
                            <a onClick={this.handleLoadAll}
                                className="all btn btn-block btn-info"><i className="fa fa-arrow-circle-down"></i>
                                    &nbsp; Load All (<span className="record-count">{this.props.collection.objectCount}</span>)</a>
                            : null
                        }
                        </div>
                    </caption>
                </table>
                {
                    this.state.exported ? <div className="export-container">
                        <JSONExport description="Virtual Machines grouped by owner" data={this.state.exported} onRequestHide={this.handleDismissExport} />
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
        adminui.vent.trigger('showview', 'vm', { vm: vmModel });
    },
    navigateToOwnerDetailsPage: function(user) {
        adminui.vent.trigger('showcomponent', 'user', { user: user });
    },
    renderVm: function(vmModel) {
        var vm = vmModel.toJSON();
        console.debug('[VmsList] renderVm: ', vm);
        var vmUrl = '/vms/' + vm.uuid;

        var isDocker = vm.docker === true || vm.tags.JPC_tag === 'DockerHost';
        var ips = vm.nics.map(function(n) {
            return n.ip;
        });

        return <tr key={vm.uuid}>
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
    }
});

module.exports = VmsList;
