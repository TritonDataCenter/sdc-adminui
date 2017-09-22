/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';
var adminui = require('../../../adminui');
var _ = require('underscore');
var $ = require('jquery');
var React = require('react');
var FabricNetwork = require('../../../models/fabrics-vlan-network');
var NicTag = require('../../../models/nictag');
var Networks = require('../../../models/networks');
var Network = require('../../../models/network');
var FilterForm = require('../../filter-form');
var BB = require('../../bb');
var PaginationView = require('../../../views/pagination');

var NetworksList = React.createClass({
    displayName: 'NetworksList',
    propTypes: {},

    getInitialState: function () {
        return {
            collection: this.props.collection || new Networks(),
            showHeader: this.props.hasOwnProperty('showHeader') ? this.props.showHeader : true,
            params: this.props.params,
            isFabricsView: this.props.hasOwnProperty('isFabricsView') ? this.props.isFabricsView : false,
            filterTypes: this.props.filterTypes,
            pagination: this.props.pagination
        };
    },

    componentWillMount: function () {
        var collection = this.state.collection;
        var params = this.state.params;
        var uuids = this.props.uuids;
        if (uuids) {
            _.each(uuids, function (uuid) {
                var network = new Network({uuid: uuid});
                network.fetch().done(function () {
                    collection.add(network.toJSON());
                });
            });
            return;
        }
        if (!this.props.collection && params) {
            if (params.hasOwnProperty('fabric')) {
                if (Object.keys(params).length === 1 && params.fabric) {
                    return;
                }
                collection.params = {fabric: params.fabric};
                delete params.fabric;
            }
            var fetchParams = {success: function (data, response) {
                collection.reset(response);
            }};
            if (Object.keys(params).length) {
                fetchParams.params = params;
            }
            collection.fetch(fetchParams);
        }
    },

    componentDidMount: function () {
        this.state.collection.on('sync', this._onSync, this);
        this.state.collection.on('reset', this._onSync, this);
        this.state.collection.on('add', this._onSync, this);
        this.state.collection.on('remove', this._onSync, this);
    },

    _onSync: function () {
        var promises = [];
        var self = this;
        this.nicTagsMtu = {};
        var collection = this.state.collection;
        collection.each(function (network) {
            var deferred = $.Deferred();
            var nicTagNmae = network.get('nic_tag');
            if (self.nicTagsMtu[nicTagNmae]) {
                deferred.resolve();
            } else {
                var nicTag = new NicTag({name: nicTagNmae});
                nicTag.fetch().done(function (nicTag) {
                    self.nicTagsMtu[nicTagNmae] = nicTag.mtu;
                    deferred.resolve();
                });
            }

            promises.push(deferred);
        });
        $.when.apply($, promises).then(function () {
            self.setState({collection: collection});
        });
    },

    componentWillUnmount: function() {
        this.state.collection.off('sync');
        this.state.collection.off('reset');
        this.state.collection.off('add');
        this.state.collection.off('remove');
    },

    createNetwork: function () {
        var model = new Network();
        var collection = this.props.collection;
        if (collection && collection.url) {
            model.url = collection.url;
        }
        adminui.vent.trigger('showview', 'network-form', {
            model: model,
            isFabric: this.state.isFabricsView,
            data: $.extend(this.props.data, this.state.params)
        });
    },

    showNetwork: function (model) {
        adminui.vent.trigger('showview', 'network', {model: model});
    },

    deleteNetwork: function (model, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        var confirm = window.confirm(
            _.str.sprintf('Are you sure you want to delete the network "%s" ?', model.get('name'))
        );
        if (confirm) {
            var network = model.toJSON();
            model.destroy({contentType: 'application/json', data: JSON.stringify(network), wait: true}).done(function () {
                var notifyMsg = _.str.sprintf('Network <strong>%s</strong> deleted successfully.', network.name);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: notifyMsg
                });
            }).fail(function (error) {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: error.responseData.message
                });
            });
        }
    },

    renderNetwork: function (model) {
        var network = model.toJSON();
        this.nicTagsMtu =  this.nicTagsMtu || {};
        var resolvers = network.resolvers && network.resolvers.join(', ') || '-';
        var owners = '-';
        var ownerUuid = network.owner_uuid;
        var ownerUuids = Array.isArray(network.owner_uuids) ? network.owner_uuids : ownerUuid ? [ownerUuid] : [];
        owners = ownerUuids.map(function (uuid) {
            return (<a className="owner-link" data-owner-uuid={uuid} target="_tab" href={"/users/" + uuid}>
                <i className="fa fa-external-link"> {uuid}</i>
            </a>)
        });
        return (<li>
            <div className="name"><a onClick={this.showNetwork.bind(this, model)}>{network.name}</a> <span classNmae="subnet">{network.subnet}</span></div>
            <div className="vlan">
                <strong>VLAN ID</strong>
                <span className="value">{network.vlan_id}</span>
            </div>
            <div className="gateway">
                <strong>Gateway</strong>
                <span className="value">{network.gateway || '-'}</span>
            </div>
            <div className="provision-ip-range">
                <strong>Range</strong>
                <span className="value">{network.provision_start_ip} - {network.provision_end_ip}</span>
            </div>
            <div className="resolvers">
                <strong>Resolvers</strong>
                <span className="value">
                    {resolvers}
                </span>
            </div>
            <div className="owners">
                <strong>Owners</strong>
                <span className="value">
                    {owners.length ? owners : '-'}
                </span>
            </div>
            <div className="mtu">
                <strong>MTU / NIC Tag MTU</strong>
                <span className="value">{network.mtu} / {this.nicTagsMtu[network.nic_tag]}</span>
            </div>
            {this.props.showActions && adminui.user.role('operators') ?
                (<div className="actions">
                    <a onClick={this.deleteNetwork.bind(this, model)} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
                </div>)
            : null}
        </li>);
    },

    render: function () {
        var networksCollection = this.state.collection;
        var networksCount = networksCollection.length;
        var initialParams = this.state.params;
        var title = networksCount > 0 ? _.str.sprintf('Showing %s Network%s', networksCount, networksCount > 1 ? 's' : '') :
            'There are no Networks';
        var pagination = '';
        if (this.state.pagination) {
            pagination = <BB view={new PaginationView({collection: networksCollection})} />
        }
        return <div>
            {this.props.showCreateButton && (
            <div className="create-action">
                <button type="button" className="btn btn-sm btn-info" onClick={this.createNetwork}><i className="fa fa-plus"></i> New Network</button>
            </div>)}
            {this.state.filterTypes && <FilterForm handleSearch={this.query} types={this.state.filterTypes} initialParams={initialParams} />}
            {this.state.showHeader && <div className="network-list-header list-header">
                <div className="title">{title}</div>
            </div>}
            {networksCount > 0 ? (<div className="networks-list">
                <ul className="list-unstyled networks-list">
                    {networksCollection.map(this.renderNetwork)}
                </ul>
                {pagination}
            </div>) : null}
        </div>;
    },

    query: function (params) {
        var collection = this.state.collection;
        collection.params = {fabric: this.state.isFabricsView};
        if (params.hasOwnProperty('fabric')) {
            collection.params = {fabric: params.fabric};
            delete params.fabric;
        }
        this.setState({params: params}, function () {
            if (this.props.onSearch && typeof this.props.onSearch === 'function') {
                this.props.onSearch(params);
            }
            
            if (!Object.keys(params).length && this.state.isFabricsView) {
                collection.reset();
                return;
            }
            collection.fetch({params: params, success: function (data, response) {
                collection.reset(response);
            }});
        }, this);
    }
});

module.exports = NetworksList;
