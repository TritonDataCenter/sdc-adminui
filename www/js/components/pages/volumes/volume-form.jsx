/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var React = require('react');
var Chosen = require('react-chosen');
var _ = require('underscore');
var PropTypes = React.PropTypes;

var app = require('../../../adminui');
var api = require('../../../request');
var UserInput = require('../../../views/typeahead-user');
var Networks = require('../../../models/networks');
var ErrorAlert = require('../../error-alert');

var VolumeForm = React.createClass({
    propTypes: {
        handleSave: PropTypes.func,
        handleCancel: PropTypes.func
    },
    getDefaultProps: function () {
        return {
            handleCancel: function () {},
            creating: false
        };
    },
    getInitialState: function () {
        return {
            userNetworks: {},
            networks: [],
            sizeMeasure: 'MB'
        };
    },
    componentDidMount: function () {
        var self = this;
        this.networks = new Networks();
        this.userInput = new UserInput({
            accountsOnly: true,
            el: React.findDOMNode(self.refs.owner)
        });

        this.userInput.render();
        this.userInput.on('selected', self.onSelectUser, self);
    },
    onSelectUser: function () {
        var userId = this.userInput.selectedUser && this.userInput.selectedUser.id;
        userId = userId && userId.length === 36 ? userId : null;
        var ownerUuid = this.state.owner_uuid;
        this.setState({
            loading: true,
            owner_uuid: userId,
            networks: []
        });

        if (userId && userId !== ownerUuid) {
            var self = this;
            if (this.state.userNetworks[userId]) {
                return self.setState({
                    error: null,
                    loading: false,
                    networks: self.state.userNetworks[userId]
                });
            }
            var req = this.networks.fetch({params: {
                provisionable_by: userId,
                fabric: true
            }});
            req.fail(function (xhr) {
                self.setState({
                    loading: false,
                    error: xhr.responseText
                });
            });

            req.done(function () {
                self.state.userNetworks[userId] = self.networks;
                self.setState({
                    error: null,
                    loading: false,
                    userNetworks: self.state.userNetworks
                });
            });
        }
    },
    onSelectNetworks: function (e, data) {
        if (data.selected) {
            this.state.networks.push(data.selected);
        } else if (data.deselected) {
            this.state.networks = _.without(this.state.networks, data.deselected)
        }
        this.setState({networks: this.state.networks});
    },
    renderNetworkSelect: function () {
        var networks = this.networks.fullCollection.toJSON();
        return (
            <Chosen onChange={this.onSelectNetworks}
                    className="form-control"
                    name="network_uuid"
                    data-placeholder="Select a Network"
                    value={this.state.networks}
                    multiple>
                <option value=""></option>
                {
                    networks.map(function (network) {
                        return (<option key={network.uuid} value={network.uuid}>{network.name} - {network.subnet}</option>);
                    })
                }
            </Chosen>
        );
    },
    render: function () {
        var state = this.state;
        return (
            <div className="panel panel-info">
                <div className="panel-heading">
                    Create new Volume
                </div>
                <div className="panel-body">
                    <form className="form-horizontal volume-form widget-content">
                        {state.error && <ErrorAlert error={state.error} />}
                        <div className="form-group">
                            <label className="control-label col-sm-4">Name</label>
                            <div className="controls col-sm-6">
                                <input placeholder="name of volume" type="text" onChange={this._handleChangeName} value={state.name} className="form-control" name="name" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="control-label col-sm-4">Size</label>
                            <div className="col-sm-2">
                                <input type="number" onChange={this._handleChangeSize} className="form-control" value={state.size} name="size" ref="size" />
                            </div>
                            <div className="col-sm-2">
                                <select className="form-control" onChange={this._handleChangeSizeMeasure} value={state.sizeMeasure}>
                                    <option key="m" value="MB">MB</option>
                                    <option key="g" value="GB">GB</option>
                                </select>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="control-label col-sm-4">Owner</label>
                            <div className="col-sm-6">
                                <input type="text" className="form-control" name="owner_uuid" ref="owner" />
                            </div>
                        </div>
                        {state.owner_uuid ?
                            <div className="form-group form-group-network row">
                                <label className="control-label col-sm-4">Networks</label>

                                <div className="controls col-sm-6">
                                    {state.loading ?
                                        <div className="loading">
                                            <i className="fa fa-spinner fa-spin"></i> Retrieving Networks
                                        </div> : this.renderNetworkSelect()
                                    }
                                </div>
                            </div> : null
                        }
                        <div className="form-group">
                            <div className="col-sm-offset-4 col-sm-6">
                                {state.creating ? <div className="loading"><i className="fa fa-spinner fa-spin"></i> Creating volume</div> :
                                    <div>
                                        <button disabled={!(state.name && state.owner_uuid && state.networks.length)}  className="btn btn-primary" onClick={this._handleSave} type="submit">Save Volume</button>
                                        <button className="btn btn-link" onClick={this._handleCancel} type="button">Cancel</button>
                                    </div>
                                }
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        );
    },
    _handleCancel: function () {
        this.props.handleCancel();
    },
    _handleSave: function (e) {
        e.preventDefault();
        var state = this.state;
        var data = {
            name: state.name,
            type: 'tritonnfs',
            owner_uuid: state.owner_uuid,
            networks: state.networks
        };
        if (state.size) {
            data.size = state.size + state.sizeMeasure;
        }

        this.setState({error: null, creating: true});
        api.post('/api/volumes').send(data).end(function (res) {
            if (res.error) {
                this.setState({error: res.body, creating: false});
                return;
            }
            if (res.ok) {
                app.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('Volume <strong>%s</strong> has been created successfully', state.name)
                });
                if (this.props.handleSave) {
                    return this.props.handleSave(state);
                }
            }
        }.bind(this));
    },
    _handleChangeName: function (e) {
        this.setState({name: e.target.value});
    },
    _handleChangeSize: function (e) {
        this.setState({size: e.target.value});
    },
    _handleChangeSizeMeasure: function (e) {
        this.setState({sizeMeasure: e.target.value});
    }
});

module.exports = VolumeForm;
