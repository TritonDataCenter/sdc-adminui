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
var React = require('react');
var Fabrics = require('../../../models/fabrics-vlans');

var FabricVlansListItem = React.createClass({
    getInitialState: function () {
        return {
            model: this.props.vlan
        };
    },
    handleClick: function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        adminui.vent.trigger('showview', 'fabric-vlan', {model: this.state.model});
    },
    deleteVlan: function (e) {
        var self = this;
        var data = self.state.model.toJSON();
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        var confirm = window.confirm(
            _.str.sprintf('Are you sure you want to delete VLAN "%s" ?', this.state.model.get('name'))
        );
        if (confirm) {
            this.state.model.destroy({contentType: 'application/json', data: JSON.stringify(data)}).done(function () {
                var notifyMsg = _.str.sprintf('Fabric VLAN <strong>%s</strong> deleted successfully.', data.name);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: notifyMsg
                });
                self.props.deleteHandler();
            }).fail(function (err) {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: 'Failed to remove fabric VLAN: ' + err.responseData.message,
                    persistent: true
                });
            });
        }
    },
    handleEdit: function (e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        this.props.handleEdit(this.state.model);
    },
    render: function () {
        var data = this.state.model.toJSON();
        return (<li className='vlan-item'>
                <div className="name">
                    <a onClick={this.handleClick}>{data.name}</a>
                </div>
                <div className="vlan">
                    <strong>VLAN ID</strong>
                    <span className="value">{data.vlan_id}</span>
                </div>
                <div className="description">
                    <strong>Description</strong>
                    <span className="value">{data.description}</span>
                </div>
                {adminui.user.role('operators') ?
                    <div className="actions">
                        <a onClick={this.handleEdit} className="edit"><i className="fa fa-pencil"></i> Edit</a>
                        <a onClick={this.deleteVlan} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
                    </div>
                    : null}
            </li>
        );
    }
});

var FabricVlansList = React.createClass({
    getInitialState: function () {
        return {collection: this.props.collection};
    },

    componentDidMount: function () {
        this.props.collection.on('sync', this._onSync, this);
    },

    _onSync: function () {
        this.setState({collection: this.props.collection});
    },
    onDelete: function () {
        this.props.collection.fetch();
    },
    render: function () {
        var self = this;
        var collection = this.state.collection;
        var fabricsCount = collection.length;
        var output = null;
        if (fabricsCount) {
            var nodes = collection.map(function (vlan) {
                return <FabricVlansListItem key={vlan.id} vlan={vlan} handleEdit={self.props.handleEdit} deleteHandler={self.onDelete} />;
            });
            output = (<div>
                <h3>Fabric VLANs</h3>
                <div className="vlan-list-header list-header">
                    <div className="title">
                        Showing {fabricsCount} Fabric VLAN{fabricsCount > 1 && 's'}
                    </div>
                </div>
                <div className="vlans-list">
                    <ul className="list-unstyled fabric-vlans-list">{nodes}</ul>
                </div>
            </div>);
        }
        return output;
    }
});

module.exports = FabricVlansList;

