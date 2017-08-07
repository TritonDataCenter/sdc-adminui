/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var adminui = require('adminui');

var Backbone = require('backbone');
var React = require('react');
var FabricVlans = require('../models/fabrics-vlans');
var $ = require('jquery');
var _ = require('underscore');
var NetworkList = require('../components/pages/networking/networks-list.jsx');
var FabricNetwork = require('../models/fabrics-vlan-network');
var FabricVlansList = require('../components/pages/networking/fabric-vlan-list.jsx');


var FabricVlansPage = React.createClass({
    getInitialState: function () {
        return {
            vlan_ids: [],
            showList: false
        };
    },
    componentWillMount: function () {
        this.vlans = new FabricVlans;
        this.query(this.props.query);
    },
    handleEdit: function (data) {
        var self = this;
        adminui.vent.trigger('showcomponent', 'vlan-form', {
            data: data,
            query: self.filterOptions
        });
    },
    createNetwork: function () {
        var model = new FabricNetwork();
        var self = this;
        adminui.vent.trigger('showview', 'network-form', {
            model: model,
            isFabric: true,
            tab: 'fabrics',
            query: self.filterOptions,
            data: {
                owner_uuid: this.state.ownerUuid,
                vlans: self.vlans.models.map(function (vlan) {
                    return vlan.attributes;
                })
            }
        });
    },
    createVlan: function () {
        var self = this;
        adminui.vent.trigger('showcomponent', 'vlan-form', {
            data: {owner_uuid: self.state.ownerUuid},
            query: self.filterOptions,
            vlan_ids: self.vlans.models.map(function (vlan) {
                return vlan.id;
            })
        });
    },
    render: function () {
        var list = (
            <NetworkList
                params={this.filterOptions ? _.extend({fabric: true}, this.filterOptions) : null}
                showActions={true}
                isFabricsView={true}
                filterTypes={['owner_uuid', 'vlan_id', 'uuid']}
                onSearch={this.query} />
        );

        var vlanList = (
            <FabricVlansList
                collection={this.vlans}
                handleEdit={this.handleEdit} />
        );

        return (<div className="fabric-vlans">
            <h3>Fabric Networks
                <div className="actions">
                    {!this.state.form && (<div>
                        <button type="button" className="btn btn-sm btn-info" onClick={this.createNetwork}>
                            <i className="fa fa-plus"></i>
                            &nbsp;New Fabric Network
                        </button>
                        <button className="btn btn-sm btn-info" onClick={this.createVlan}>
                            <i className="fa fa-plus"></i>
                            &nbsp;New Fabric VLAN
                        </button>
                    </div>)}
                </div>
            </h3>
            {list}
            {this.state.showList && vlanList}
        </div>);
    },
    query: function (data) {
        var self = this;
        this.filterOptions = data || null;
        var owner = data && data.owner_uuid;
        if (!owner) {
            this.setState({showList: false, ownerUuid: null});
            return;
        }
        if (owner !== self.state.ownerUuid) {
            this.setState({ownerUuid: owner, showList: false});
            this.vlans.params.owner_uuid = owner;
            this.vlans.fetch().done(function () {
                self.setState({showList: true});
            });
        }
    }
});

module.exports = Backbone.Marionette.View.extend({
    sidebar: 'networking',
    onShow: function () {
        var params = this.options;
        var Page = React.createFactory(FabricVlansPage);
        React.render(Page(params), this.$el.get(0));
        return this;
    }
});

