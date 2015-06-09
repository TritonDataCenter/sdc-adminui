/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var adminui = require('adminui');

var React = require('react');
var Fabrics = require('../models/fabrics-vlans');
var ErrorAlert = require('../components/error-alert');
var $ = require('jquery');
var api =require('../request');
var _ = require('underscore');
var UserInput = require('../views/typeahead-user');

var FabricVlansPage = React.createClass({
    getInitialState: function () {
        return {
            form: (this.props.form || false),
            formData: {},
            vlan: null,
            userUuid: adminui.user.id
        };
    },
    _showForm: function () {
        this.setState({form: true});
    },
    _hideForm: function () {
        this.setState({form: false, error: null, vlan: null});
    },
    componentDidMount: function () {
        if (adminui.user.role('operators')) {
            var $node = $(this.getDOMNode());
            this.ownerInput = new UserInput({
                el: $node.find('.owner')
            });
            this.ownerInput.render();
        }
    },
    handleSetOwner: function () {
        this.ownerInput.selectedUser = this.ownerInput.selectedUser || {id: adminui.user.id};
        if (this.ownerInput.selectedUser.id !== this.state.userUuid) {
            this.setState({params: {owner_uuid: this.ownerInput.selectedUser.id}, userUuid: this.ownerInput.selectedUser.id});
        }
    },
    handleSave: function (params) {
        var self = this;
        var successCallback = function (msg) {
            self._hideForm();
            adminui.vent.trigger('notification', {
                level: 'success',
                message: msg
            });
        }
        if (this.state.vlan) {
            return this.state.vlan.save(params).done(function () {
                successCallback(_.str.sprintf('Fabric Vlan <strong>%s</strong> successfully updated', params.name));
            }).fail(function (err) {
                self.setState({error: err.responseData});
            });
        }
        api.post('/api/fabrics').send(params).end(function (res) {
            if (res.error) {
                self.setState({error: res.body});
                return;
            }
            if (res.ok) {
                successCallback(_.str.sprintf('Fabric Vlan <strong>%s</strong> created successfully', params.name));
            }
        }.bind(this));
    },
    handleEdit: function (data) {
        this.setState({vlan: data, form: true});
    },
    render: function () {
        return <div className="fabric-vlans">
            <h3>Fabric Vlans
                <div className="actions">
                    <button className="btn btn-sm btn-info" onClick={this._showForm}>
                        <i className="fa fa-plus"> New Fabric Vlan</i>
                    </button>
                </div>
            </h3>
            { adminui.user.role('operators') && !this.state.form &&
                <div className="row">
                    <div className="col-sm-12">
                        <input type="text" placeholder={this.state.userUuid} onBlur={this.handleSetOwner} className="form-control owner" name="owner_uuid" />
                    </div>
                </div> }
            { this.state.error && <ErrorAlert error={this.state.error} /> }
            { this.state.form && <FabricVlanForm handleClose={this._hideForm} handleSave={this.handleSave} data={this.state.vlan && this.state.vlan.toJSON()} /> }
            { !this.state.form && <FabricVlansList params={this.state.params} handleEdit={this.handleEdit} /> }
        </div>;
    }
});

var FabricVlanForm = React.createClass({
    getInitialState: function () {
        return this.props.data || {};
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
    _handleSetOwner: function () {
        if (this.ownerInput.selectedUser) {
            this.setState({owner_uuid: this.ownerInput.selectedUser.id});
        }
    },
    _onSave: function (e) {
        e.preventDefault();
        var vlan = this.state;
        if (vlan.owner_uuid && vlan.owner_uuid.length !== 36) {
            vlan.owner_uuid = '';
        }
        this.props.handleSave(vlan);
    },
    componentDidMount: function () {
        if (adminui.user.role('operators')) {
            var $node = $(this.getDOMNode());
            this.ownerInput = new UserInput({
                el: $node.find('.vlan-owner')
            });
            this.ownerInput.render();
        }
    },
    render: function () {
        return <div className="panel">
            <div className="panel-body">
             <h4 className="panel-title">{this.props.data ? 'Edit' : 'New'} Fabric Vlan</h4>
             <form className="form form-horizontal">
                { adminui.user.role('operators') && !this.props.data &&
                <div className="form-group">
                    <label className="control-label col-sm-5">Owner</label>
                    <div className="col-sm-5">
                        <input type="text" placeholder={adminui.user.id} onBlur={this._handleSetOwner} className="form-control vlan-owner" value={this.state.owner_uuid} name="owner_uuid" />
                    </div>
                </div> }
                <div className="form-group">
                    <label className="control-label col-sm-5">Name</label>
                    <div className="col-sm-5">
                        <input placeholder="name of Fabric Vlan (eg: acme-admin)" onChange={this._onChangeName} type="text" value={this.state.name} className="form-control" name="name" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="control-label col-sm-5">Description</label>
                    <div className="col-sm-5">
                        <textarea className="form-control" rows="3" name="description" onChange={this._onChangeDescription}>{this.state.description}</textarea>
                    </div>
                </div>
                { !this.props.data &&
                <div className="form-group">
                    <label className="control-label col-sm-5">VLAN ID</label>
                    <div className="col-sm-5">
                        <input placeholder="VLAN ID" value={this.state.vlan_id} onChange={this._onChangeVlanId} type="text" className="form-control" name="vlan_id" />
                    </div>
                </div> }
                <div className="form-group">
                    <div className="col-sm-offset-5 col-sm-5">
                        <button disabled={ !(this.state.name && this.state.name.length) }  className="btn btn-primary" onClick={this._onSave} type="submit">Save Fabric Vlan</button>
                        <button className="btn btn-link" onClick={this.props.handleClose} type="button">Cancel</button>
                    </div>
                </div>
            </form>
            </div>
        </div>
    }
});

var FabricVlansList = React.createClass({
    getInitialState: function () {
        return {
            data: []
        };
    },
    componentWillMount: function () {
        this.fabrics = new Fabrics();
        if (this.props.params) {
            this.fabrics.params = this.props.params;
        }
        this.setData();
    },
    componentWillReceiveProps: function (nextProps) {
        if (nextProps.params !== this.props.params) {
            this.setData({params: nextProps.params});
        }
    },
    setData: function (params) {
        var self = this;
        params = params || null;
        this.fabrics.fetch(params).then(function () {
            self.setState({data: self.fabrics});
        });
    },
    render: function () {
        var self = this;
        var nodes = this.state.data.map(function (vlan) {
            return <FabricVlansListItem key={vlan.id} vlan={vlan} handleEdit={self.props.handleEdit} />;
        });
        return <ul className="list-unstyled fabric-vlans-list">{nodes}</ul>;
    }
});

var FabricVlansListItem = React.createClass({
    getInitialState: function () {
        return {
            model: this.props.vlan
        };
    },
    onClick: function () {
        adminui.vent.trigger('showview', 'fabric-vlan', {model: this.state.model});
        return false;
    },
    deleteVlan: function (data, e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        var confirm = window.confirm(
            _.str.sprintf('Are you sure you want to delete the vlan "%s" ?', this.state.model.get('name'))
        );
        if (confirm) {
            this.state.model.destroy({contentType: 'application/json', data: JSON.stringify(data)}).done(function () {
                var notifyMsg = _.str.sprintf('Fabric vlan <strong>%s</strong> deleted successfully.', vlan.name);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: notifyMsg
                });
            }).fail(function (err) {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: 'Failed to remove fabric vlan: ' + err.responseData.message,
                    persistent: true
                });
            });
        }
    },
    render: function () {
        var data = this.state.model.toJSON();
        return (<li className='vlan-item'>
            <div className="name">
                <a onClick={this.onClick.bind(this)}>{data.name}</a>
            </div>
            <div className="vlan">
                <strong>VLAN ID</strong>
                <span className="value">{data.vlan_id}</span>
            </div>
            <div className="vnet">
                <strong>VNET ID</strong>
                <span className="value">{data.vnet_id}</span>
            </div>
            <div className="description">
                <strong>Description</strong>
                <span className="value">{data.description}</span>
            </div>
            {adminui.user.role('operators') || adminui.user.role('readers') ?
                <div className="actions">
                    <a onClick={this.props.handleEdit.bind(this, this.state.model)} className="edit"><i className="fa fa-pencil"></i> Edit</a>
                    <a onClick={this.deleteVlan.bind(this, data)} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
                </div>
            : null}
            </li>
        );
    }
});

module.exports = Backbone.Marionette.View.extend({
    sidebar: 'networking',
    onShow: function () {
        var Page = React.createFactory(FabricVlansPage);
        React.render(Page(), this.$el.get(0));
        return this;
    }
});

