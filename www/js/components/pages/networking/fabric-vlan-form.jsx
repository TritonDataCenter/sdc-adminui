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
var adminui = require('../../../adminui');
var UserInput = require('../../../views/typeahead-user');
var Fabrics = require('../../../models/fabrics-vlans');
var api =require('../../../request');
var ErrorAlert = require('../../error-alert');

var setUserInput = function (element, defaultValue) {
    var options = {
        el: React.findDOMNode(element)
    };
    if (defaultValue !== adminui.user.id) {
        options.preSelectedUser = defaultValue;
    }
    var node = new UserInput(options);
    node.render();
    return node;
};

var FabricVlanForm = React.createClass({
    getInitialState: function () {
        var data = this.props.data || {};
        return data.hasOwnProperty('id') ? data.toJSON() : data;
    },
    componentDidMount: function () {
        if (adminui.user.role('operators') && !this.props.data.hasOwnProperty('id')) {
            this.ownerInput = setUserInput(this.refs.owner, this.state.owner_uuid);
            this.ownerInput.on('selected', this._onSelectedOwner, this);
        }
    },
    _onChangeName: function (e) {
        this.setState({name: e.target.value});
    },
    _onChangeDescription: function (e) {
        this.setState({description: e.target.value});
    },
    _onChangeVlanId: function (e) {
        var val = parseInt(e.target.value, 10);
        val = isNaN(val) ? '' : val;
        this.setState({vlan_id: val});
    },
    _onSelectedOwner: function () {
        var selectedUserId = this.ownerInput.selectedUser && this.ownerInput.selectedUser.id;
        if (selectedUserId !== this.state.owner_uuid) {
            var fabrics = new Fabrics();
            var self = this;
            fabrics.fetch({params: {owner_uuid: selectedUserId}}).then(function () {
                self.setState({owner_uuid: selectedUserId, vlan_ids: fabrics.pluck('vlan_id')});
            });
        }
    },
    _onClose: function () {
        var self = this;
        adminui.vent.trigger('showview', 'networking', {
            tab: 'fabrics',
            query: self.props.query
        });
    },
    _onSave: function (e) {
        e.preventDefault();
        var vlan = this.state;
        delete vlan.vlan_ids;
        if (vlan.owner_uuid && vlan.owner_uuid.length !== 36) {
            vlan.owner_uuid = '';
        }
        var self = this;
        var successCallback = function (msg) {
            self._onClose();
            adminui.vent.trigger('notification', {
                level: 'success',
                message: msg
            });
        };
        if (!vlan.description) {
            delete vlan.description;
        }
        if (this.props.data.hasOwnProperty('id')) {
            return this.props.data.save(vlan).done(function () {
                successCallback(_.str.sprintf('Fabric VLAN <strong>%s</strong> successfully updated', vlan.name));
            }).fail(function (err) {
                self.setState({error: err.responseData});
            });
        }
         api.post('/api/fabrics').send(vlan).end(function (res) {
             if (res.error) {
                 self.setState({error: res.body});
                 return;
             }
             if (res.ok) {
                 successCallback(_.str.sprintf('Fabric VLAN <strong>%s</strong> created successfully', vlan.name));
             }
         }.bind(this));
    },
    render: function () {
        var reservedVlans = this.state.vlan_ids || this.props.vlan_ids;
        reservedVlans = reservedVlans && reservedVlans.join(', ');
        return (<div>
            <div className="row">
                <div className="col-md-8 col-md-offset-1">
                    <div className="page-header">
                        <h4 className="panel-title">{this.props.data.hasOwnProperty('id')? 'Edit' : 'New'} Fabric VLAN</h4>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-9 col-md-offset-1">
                    <form className="form-horizontal">
                        {this.state.error && <ErrorAlert error={this.state.error} />}
                        {adminui.user.role('operators') && <div className="form-group">
                            <label className="control-label col-sm-4">Owner</label>
                            <div className="col-sm-7">
                                {this.props.data.hasOwnProperty('id') ?
                                    <input type="text" value={this.state.owner_uuid} readOnly className="form-control" name="owner_uuid" />
                                    :
                                    <input type="text" className="form-control" name="owner_uuid" ref="owner" />
                                }
                            </div>
                        </div>}
                        <div className="form-group">
                            <label className="control-label col-sm-4">Name</label>
                            <div className="controls col-sm-7">
                                <input placeholder="name of Fabric VLAN (eg: acme-admin)" onChange={this._onChangeName} type="text" value={this.state.name} className="form-control" name="name" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="control-label col-sm-4">Description</label>
                            <div className="col-sm-7">
                                <textarea className="form-control" rows="3" name="description" value={this.state.description} onChange={this._onChangeDescription} />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="control-label col-sm-4">VLAN ID</label>
                            <div className="col-sm-7">
                                {this.props.data.hasOwnProperty('id') ?
                                    <input value={this.state.vlan_id} readOnly type="text" className="form-control" name="vlan_id"/>
                                    :
                                    <input placeholder="0" value={this.state.vlan_id} onChange={this._onChangeVlanId} type="text" className="form-control" name="vlan_id"/>
                                }
                                {reservedVlans && !this.props.data.hasOwnProperty('id') && <span>VLAN IDs: <strong>{reservedVlans}</strong> are already in use</span>}
                            </div>
                        </div>
                        <div className="form-group">
                            <div className="col-sm-offset-4 col-sm-8">
                                <button disabled={!(this.state.name && this.state.name.length)}  className="btn btn-primary" onClick={this._onSave} type="submit">Save Fabric VLAN</button>
                                <button className="btn btn-link" onClick={this._onClose} type="button">Cancel</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>);
    }
});

module.exports = FabricVlanForm;

