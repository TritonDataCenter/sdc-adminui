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
var React = require('react');
var FabricNetwork = require('../models/fabrics-vlan-network');
var NetworkForm = require('../views/networks-create');

var NetworksList = React.createClass({
    displayName: 'NetworksList',
    propTypes: {
        'collection': React.PropTypes.object.isRequired,
        'data': React.PropTypes.object.isRequired
    },

    getInitialState: function () {
        return {collection: this.props.collection};
    },

    componentDidMount: function () {
        this.props.collection.on('sync', this._onSync, this);
    },

    _onSync: function () {
        this.setState({collection: this.props.collection});
    },

    createNetwork: function () {
        var self = this;
        var model = new FabricNetwork();
        model.url = this.props.collection.url;
        var view = new NetworkForm({
            model: model,
            isFabric: true,
            data: this.props.data
        });
        view.show();
        model.on('sync', function () {
            self.props.collection.fetch();
        });
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
            var self = this;
            var network = model.toJSON();
            model.destroy({contentType: 'application/json', data: JSON.stringify(network)}).done(function () {
                var notifyMsg = _.str.sprintf('Fabric Network <strong>%s</strong> deleted successfully.', network.name);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: notifyMsg
                });
                self.props.collection.fetch();
            });
        }
    },

    renderNetwork: function (model) {
        var network = model.toJSON();
        var resolvers = network.resolvers.join(', ') || '-';
        return <li><div className="name"><a onClick={this.showNetwork.bind(this, model)}>{network.name}</a> <span classNmae="subnet">{network.subnet}</span></div>
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
            {adminui.user.role('operators') || adminui.user.role('readers') ?
                <div className="actions">
                    <a onClick={this.deleteNetwork.bind(this, model)} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
                </div>
            : null}
        </li>;
    },

    render: function () {
        return <div>
            <div className="create-action">
                <button type="button" className="btn btn-sm btn-info" onClick={this.createNetwork.bind(this)}><i className="fa fa-plus"></i> New Network</button>
            </div>
            <div className="networks-list">
                <ul className="list-unstyled fabric-networks-list">
                    {this.state.collection.map(this.renderNetwork, this)}
                </ul>
                <div className="count">
                    {this.state.collection.length} Networks
                </div>
            </div>
        </div>;
    },

    showNetwork: function (model) {
        adminui.vent.trigger('showview', 'network', {model: model});
    }
});

module.exports = NetworksList;
