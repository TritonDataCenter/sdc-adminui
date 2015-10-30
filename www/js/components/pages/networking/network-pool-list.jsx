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
var NetworkPools = require('../../../models/network-pools');
var NetworkPool = require('../../../models/network-pool');
var NetworksList = require('./networks-list');

var NetworkPoolList = React.createClass({
    getInitialState: function () {
        return {
            collection: this.props.collection || new NetworkPools(),
            params: this.props.params || {}
        }
    },
    componentWillMount: function () {
        var uuids = this.props.uuids;
        if (uuids) {
            _.each(uuids, function (uuid) {
                var networkPool = new NetworkPool({uuid: uuid});
                networkPool.fetch().done(function () {
                    collection.add(networkPool.toJSON());
                });
            });
            return;
        }
        var params = Object.keys(this.state.params).length ? {params: this.state.params} : {};
        this.state.collection.fetch(params);
    },
    componentDidMount: function () {
        this.state.collection.on('sync', this._onSync, this);
        this.state.collection.on('add', this._onSync, this);
    },
    _onSync: function () {
        var self = this;
        var collection = this.state.collection;
        this.setState({collection: collection}, function () {
            self.state.collection.each(function (item) {
                $(React.findDOMNode(self.refs['networksList_' + item.get('uuid')])).hide();
            });
        });
    },
    showNetworks: function (uuid) {
        var el = $(React.findDOMNode(this.refs['networksList_' + uuid]));
        if (el.is(':visible')) {
            el.hide();
        } else {
            el.show();
        }
    },
    onEditNetworkPool: function (model) {
        adminui.vent.trigger('showview', 'network-pool-form', {
            networkPool: model
        });
    },
    delete: function (model) {
        var self = this;
        model.destroy().done(function () {
            var notifyMsg = _.str.sprintf('Network <strong>%s</strong> deleted successfully.', model.get('name'));
            adminui.vent.trigger('notification', {
                level: 'success',
                message: notifyMsg
            });
            var collection = self.state.collection;
            collection.remove(model);
            self.setState({collection: collection});
        });
    },
    onClickDelete: function (model) {
        var confirmMsg = _.str.sprintf('Confirm delete network pool: %s ?', model.get('name'));
        if (window.confirm(confirmMsg)) {
            this.delete(model);
        }
    },
    render: function () {
        var self = this;
        return (<div>
            {this.state.collection.map(function (item) {
            var poll = item.toJSON();
            var nets = (<NetworksList ref={'networksList_' + poll.uuid} uuids={poll.networks} showHeader={false} />);
            return (<div key={poll.uuid}>
                <div className="network-pool-header" onClick={self.showNetworks.bind(self, poll.uuid)}>
                        <span className="name">{poll.name}</span>
                        <span className="network-count">{poll.networks.length} networks</span>
                        {adminui.user.role('operators') && <span>
                            <a className="delete" onClick={self.onClickDelete.bind(self, item)}><i className="fa fa-trash-o"></i> </a>
                            <a className="edit" onClick={self.onEditNetworkPool.bind(self, item)}><i className="fa fa-pencil"></i> Edit</a>
                        </span>}
                        <span className="uuid">{poll.uuid}</span>
                    </div>
                    <div className="networks-list-container">
                        {nets}
                    </div>
                </div>);
            })}
        </div>);
    }
});
module.exports = NetworkPoolList;
