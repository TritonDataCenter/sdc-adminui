/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var React = require('react');
var adminui = require('../../../adminui');
var $ = require('jquery');
var _ = require('underscore');
var utils = require('../../../lib/utils');

var Addresses = require('../../../models/addresses');
var NotesComponent = require('../../notes');
var BB = require('../../bb');
var PaginationView = require('../../../views/pagination');
var RESERVE = 'reserve';

var AddressesList = React.createClass({
    getInitialState: function () {
        return {
            state: 'loading',
            networkUuid: this.props.networkUuid,
            selected: [],
            updateCollection: false,
            count: this.props.count || 10,
            collection: this.props.collection || new Addresses()
        };
    },

    componentWillMount: function () {
        var self = this;
        this.state.collection.fetch().done(function () {
            var range = self.state.range || utils.getRange(self.state.collection.fullCollection, null, null);
            self.setState({state: 'done', range: range, collection: self.state.collection});
        });
        this.state.collection.on('error', function () {
            this.setState({state: 'error'});
        }, this);

        this.state.collection.on('reset', function () {
            self.setState({collection: self.state.collection});
        });
    },

    _handleSelectAddress: function (e) {
        var selected = this.state.selected;
        var ip = e.target.getAttribute('data-ip');
        var address = this.state.collection.get(ip);
        if (e.target.checked) {
            selected.push(address.toJSON());
        } else {
            var index = _.findIndex(selected, {ip: ip});
            if (index !== -1) {
                selected.splice(index, 1);
            }
        }
        this.setState({selected: selected});
    },

    _handleSelectAll: function (e) {
        var selected = this.state.selected;
        _.each(this.state.collection.toJSON(), function (address) {
            var index = _.findIndex(selected, {ip: address.ip});
            if (index >= 0 && !e.target.checked) {
                selected.splice(index, 1);
            } else if (index < 0 && e.target.checked) {
                selected.push(address);
            }
        });
        this.setState({selected: selected});
    },

    _handleClearSelection: function () {
        this.setState({selected: []});
    },

    _isSelectedAll: function () {
        var selected = this.state.selected;
        var collection = this.state.collection;
        var addresses = collection.toJSON();
        return selected.length && selected.length === collection.fullCollection.length || addresses.every(function (address) {
            return _.findWhere(selected, {ip: address.ip});
        });
    },

    notificationSuccess: function (message) {
        adminui.vent.trigger('notification', {
            level: 'success',
            message: message || 'Addresses updated'
        });
    },

    _handleAction: function (e) {
        var action = e.currentTarget.getAttribute('data-action');
        var selected = this.state.selected;
        var self = this;
        var reserve = action === RESERVE;

        var confirm = window.confirm('Are you sure you want to ' + (reserve ? '' : 'un-') + 'reserve the selected IP address(es)? This action may take a while.');
        if (confirm) {
            var collection = selected.filter(function (item) {
                return reserve && !item.reserved || !reserve && item.reserved;
            });
            if (collection.length) {
                var promises = [];
                collection.forEach(function (item) {
                    var address = self.state.collection.fullCollection.get(item.ip);
                    promises.push(
                        address.save(
                            {reserved: reserve},
                            {patch: true}
                        ).done(function () {
                            item.reserved = reserve;
                        })
                    );
                });
                $.when.apply(null, promises).done(function () {
                    self.setState({seleсted: collection});
                    self.notificationSuccess();
                });
            }
        }
    },

    reserve: function (model, reserve) {
        var self = this;
        var selected = this.state.selected || [];
        model.save({reserved: reserve}, {patch: true}).done(function () {
            if (selected.length) {
                var address = model.toJSON();
                var index = _.findIndex(selected, {ip: address.ip});
                if (index !== -1) {
                    selected[index] = address;
                }
            }
            self.setState({selected: selected});
        });
    },

    _handleSelectRange: function (e) {
        if (e) {
            e.preventDefault();
        }
        var range = this.state.range;
        var startIpLong = utils.ip2long(range.startIp);
        var endIpLong = utils.ip2long(range.endIp);
        if (startIpLong && endIpLong && startIpLong <= endIpLong) {
            var collection = this.state.collection.fullCollection.toJSON();
            startIpLong = startIpLong < range.startIpLong ? range.startIpLong : startIpLong;
            endIpLong = endIpLong > range.endIpLong ? range.endIpLong : endIpLong;
            if (startIpLong === range.startIpLong && endIpLong === range.endIpLong) {
                this.setState({selected: collection});
                return;
            }
            var selected = this.state.selected;
            collection.forEach(function (address) {
                var ipLong = utils.ip2long(address.ip);
                if (ipLong <= endIpLong && ipLong >= startIpLong) {
                    var index = _.findIndex(selected, {ip: address.ip});
                    if (index === -1) {
                        selected.push(address);
                    }
                }
            });
            this.setState({selected: selected});
        } else {
            return window.alert('Please, enter a valid IP Addresses or range');
        }
    },

    _handleAddRange: function (event) {
        var MAX_IP_COUNT = 100;
        if (event) {
            event.preventDefault();
        }
        var self = this;
        var count = this.state.count;
        if (count > MAX_IP_COUNT) {
            window.alert('IP Addresses count can\'t be more than' + MAX_IP_COUNT + '.');
            return;
        }
        var range = this.state.range;
        var collection = this.state.collection;
        var ipAddresses = utils.getNetworkIpList(collection, this.state.networkUuid, range.startIp, count, true);
        var provisionIpRange = function () {
            var promises = $.map(ipAddresses, function (address) {
                var deferred = $.Deferred();
                collection.create(address, {patch: true, wait: true, silent: true, success: function () {
                    deferred.resolve();
                }});
                return deferred.promise();
            });
            $.when.apply(null, promises).done(function () {
                collection.fetch().done(function () {
                    collection.getLastPage();
                    var plural = ipAddresses.length > 1 ? 'addresses have' : 'address has';
                    self.notificationSuccess(ipAddresses.length + ' IP ' + plural + ' been successfully added.');
                });
            });
        };

        if (ipAddresses.length) {
            provisionIpRange();
        } else {
            self.notificationSuccess('All IP addresses in this range have been added.');
        }
    },

    _handleChangeRangeAddress: function (event) {
        var value = event.target.value;
        var range = this.state.range;
        range.start = value;
        range.startIp = range.commonPart + value;
        this.setState({range: range});
    },

    _handleChangeAddressCount: function (event) {
        var value = event.target.value;
        value = value.replace(/\D/g, '');
        this.setState({count: value});
    },

    renderActionBar: function () {
        var numSelectedServers = this.state.selected.length;
        var hasNotOnlyReservedAddresses = this.state.selected.some(function (item) {return !item.reserved;});
        var hasNotOnlyUnReservedAddresses = this.state.selected.some(function (item) {return item.reserved;});
        return (<div className="actionbar row">
            <div className="actionbar-items col-sm-3">
                {numSelectedServers} address{numSelectedServers > 1 ? 'es' : ''} selected
            </div>
            <div className="actionbar-actions col-sm-7">
                {hasNotOnlyReservedAddresses && <a data-action="reserve" onClick={this._handleAction}><i className="fa fa-lock" /> Reserve</a>}
                {hasNotOnlyUnReservedAddresses && <a data-action="unreserve" onClick={this._handleAction}><i className="fa fa-unlock" /> Un-reserve</a>}
            </div>
            <div className="actionbar-clear col-sm-2">
                <a onClick={this._handleClearSelection}><i className="fa fa-times" /> Clear</a>
            </div>
        </div>);
    },

    render: function () {
        var state = this.state.state;
        var self = this;

        var getAddressUrl = function (address) {
            var type = address.belongs_to_type;
            if (type === 'zone' || type === 'server') {
                return _.str.sprintf('/%s/%s', type === 'zone' ? 'vms' : 'servers', address.belongs_to_uuid);
            }
        };

        var navigateToAddress = function (address, event) {
            if (event.metaKey || event.ctrlKey) {
                return;
            }
            event.preventDefault();

            var type = address.belongs_to_type;
            if (type === 'zone' || type === 'server') {
                adminui.router[type === 'zone' ? 'showVm' : 'showServer'](address.belongs_to_uuid);
            }
        };

        if (state === 'loading' || state === 'error') {
            return (<div className="addresses-list"><div className="zero-state">{state === 'error' ? 'Error ' : ''}Retrieving Addresses List</div></div>);
        } else {
            var addressesRows = this.state.collection.map(function (addressModel) {
                var address = addressModel.toJSON();
                var addressUrl = getAddressUrl(address);
                var notesItem = self.state.networkUuid ? [self.state.networkUuid, address.ip].join('.') : false;
                var selected = _.findWhere(self.state.selected, {ip: address.ip});
                return (<tr>
                        {adminui.user.role('operators') &&
                        <td className="select"><input onChange={this._handleSelectAddress} data-ip={address.ip} type="checkbox" checked={selected} className="input" /></td>}
                        <td>{address.ip}</td>
                        <td className="belongs-to">
                            <strong>{address.belongs_to_type}</strong>
                            {addressUrl ?
                                <a href={addressUrl} onClick={navigateToAddress.bind(null, address)}>
                                    <small>{address.belongs_to_uuid}</small>
                                </a>
                                :
                                <small>{address.belongs_to_uuid}</small>
                            }
                        </td>
                        <td>
                            <div className="reservation">
                                {address.reserved ?
                                    <div><span className="label label-info">Reserved</span><a className="btn unreserve" onClick={this.reserve.bind(null, addressModel, false)}>Unreserve</a>
                                    </div>
                                    :
                                    <a className="btn reserve" onClick={this.reserve.bind(null, addressModel, true)}>Reserve</a>
                                }
                            </div>
                        </td>
                        <td>
                            {address.free && <span className="label label-info">Free</span>}
                            {notesItem && <div className="notes-component-container"><NotesComponent item={notesItem} /></div>}
                        </td>
                    </tr>
                );
            }, this);
            var range = this.state.range;
            return (<div className="addresses-list">
                {this.state.selected.length > 0 && this.renderActionBar()}
                <table className="table">
                    <thead>
                        {adminui.user.role('operators') &&
                        <th className="select"><input type="checkbox" className="input" onChange={this._handleSelectAll} checked={this._isSelectedAll()} /></th>}
                        <th colSpan="4" className="title">
                            Showing {this.state.collection.length} IP Addresses
                            <div className="range-ips">
                                {range.commonPart}<input type="text" value={range.start} onChange={self._handleChangeRangeAddress} />
                                <span> Count </span><input type="text" value={this.state.count} onChange={self._handleChangeAddressCount} />
                                <button type="button" className="btn btn-info" onClick={this._handleSelectRange}>Select Range</button>
                                <button type="button" className="btn btn-info" onClick={this._handleAddRange}>Add IP Addresses</button>
                            </div>
                        </th>
                    </thead>
                    <tbody>
                        {addressesRows}
                    </tbody>
                </table>
                <BB view={new PaginationView({collection: this.state.collection})} />
            </div>);
        }
    }
});

module.exports = AddressesList;
