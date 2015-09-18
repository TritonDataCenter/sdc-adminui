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

var Addresses = require('../../../models/addresses');
var NotesComponent = require('../../notes');
var RESERVE = 'reserve';

var AddressesList = React.createClass({
    getInitialState: function () {
        return {
            state: 'loading',
            networkUuid: this.props.networkUuid,
            selected: [],
            updateCollection: false
        };
    },

    componentDidMount: function () {
        this.collection = this.props.collection || new Addresses();
        this.collection.fetch();
        this.collection.on('sync',  function () {
            this.setState({state: 'done'});
        }, this);
        this.collection.on('error', function () {
            this.setState({state: 'error'});
        }, this);
    },

    _handleSelectAddress: function (e) {
        var selected = this.state.selected;
        var ip = e.target.getAttribute('data-ip');
        var address = this.collection.get(ip);
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
        this.setState({selected: e.target.checked ? this.collection.toJSON() : []});
    },

    _handleClearSelection: function () {
        this.setState({selected: []});
    },

    _isSelectedAll: function () {
        return this.state.selected.length === this.props.collection.length;
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

        var confirm = window.confirm('Are you sure you want to ' + (reserve ? '' : 'un-') + 'reserve IP address(es)?');
        if (confirm) {
            var collection = selected.filter(function (item) {
                return reserve && !item.reserved || item.reserved;
            });
            if (collection.length) {
                var promises = [];
                collection.forEach(function (item) {
                    var address = self.collection.get(item.ip);
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
        var selected = this.state.selected;
        model.save({reserved: reserve}, {patch: true}).done(function () {
            if (selected.length) {
                var address = model.toJSON();

                var index = _.findIndex(selected, {ip: address.ip});
                if (index !== -1) {
                    selected[index] = address;
                    self.setState({selected: selected});
                }
            }
        });
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
        if (state === 'loading' || state === 'error') {
            return (<div className="addresses-list"><div className="zero-state">{state === 'error' ? 'Error ' : ''}Retrieving Addresses List</div></div>);
        } else {
            var addressesRows = this.collection.map(function (addressModel) {
                var address = addressModel.toJSON();
                var notesItem = self.state.networkUuid ? [self.state.networkUuid, address.ip].join('.') : false;
                var selected = _.findWhere(self.state.selected, {ip: address.ip});
                return (<tr>
                        {adminui.user.role('operators') &&
                        <td className="select"><input onChange={this._handleSelectAddress} data-ip={address.ip} type="checkbox" checked={selected} className="input" /></td>}
                        <td>{address.ip}</td>
                        <td className="belongs-to">
                            <strong>{address.belongs_to_type}</strong>
                            {address.belongs_to_url ?
                                <a href="{address.belongs_to_url}">
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
            return (<div className="addresses-list">
                {this.state.selected.length > 0 && this.renderActionBar()}
                <table className="table">
                    <thead>
                        {adminui.user.role('operators') &&
                        <th className="select"><input type="checkbox" className="input" onChange={this._handleSelectAll} checked={this._isSelectedAll()} /></th>}
                        <th className="title">
                            Showing {this.collection.length} IP Addresses<br/>
                        </th>
                        <th></th>
                        <th></th>
                        <th></th>
                    </thead>
                    <tbody>
                        {addressesRows}
                    </tbody>
                </table>
            </div>);
        }
    }
});

module.exports = AddressesList;
