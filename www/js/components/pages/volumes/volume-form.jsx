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
var ServerTypeahead = require('../../server-typeahead');
var Networks = require('../../../models/networks');
var ErrorAlert = require('../../error-alert');
var Packages = require('../../../models/packages');

var defaultHandler = function () {
    return app.vent.trigger('showcomponent', 'volumes');
};

var VolumeForm = React.createClass({
    propTypes: {
        handleSave: PropTypes.func,
        handleCancel: PropTypes.func
    },
    statics: {
        sidebar: 'volumes'
    },
    getDefaultProps: function () {
        return {
            handleCancel: defaultHandler,
            handleSave: defaultHandler,
            cancelButton: 'Back to Volumes',
            creating: false
        };
    },
    getInitialState: function () {
        return {
            userNetworks: {},
            networks: [],
            packages: [],
            type: 'tritonnfs',
            sizeMeasure: 'MB'
        };
    },
    componentDidMount: function () {
        var self = this;
        var packages = new Packages();
        packages.fetch({
            params: {
                name: 'sdc_volume_nfs*',
                active: true
            }
        }).done(function () {
            self.setState({packages: packages});
        }).fail(function (xhr) {
            self.setState({error: xhr.responseText});
        });
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
    onSelectNetwork: function (e, data) {
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
            <Chosen onChange={this.onSelectNetwork}
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
    onSelectPackage: function (e, data) {
        this.setState({size: data.selected});
    },
    renderPackageSelect: function () {
        var packages = this.state.packages.toJSON();
        return (
            <Chosen onChange={this.onSelectPackage}
                  data-placeholder="Select a Package"
                  className="form-control"
                  value={this.state.size}
                  name="package">
              <option value=""></option>
              {
                  packages.map(function (pkg) {
                      return (<option key={pkg.uuid} value={pkg.quota}>{pkg.name} {pkg.version}</option>);
                  })
              }
            </Chosen>
        );
    },
    render: function () {
        var state = this.state;
        return (
            <div className="page" id="page-volume-form">
                <div className="page-header">
                    <h1>Provision Volume</h1>
                </div>
                <div className="row">
                    <form className="form-horizontal volume-form">
                        {state.error && <ErrorAlert error={state.error} />}

                        <div className="form-group">
                            <label className="control-label col-sm-3 required">Owner</label>
                            <div className="col-sm-6">
                                <input type="text" className="form-control" name="owner_uuid" ref="owner" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="control-label col-sm-3 required">Name</label>
                            <div className="controls col-sm-6">
                                <input placeholder="name of volume" type="text" onChange={this._handleChangeName} value={state.name} className="form-control" name="name" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="control-label col-sm-3">Package</label>
                            <div className="col-sm-6">
                                {state.packages.length ? this.renderPackageSelect() : null}
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="control-label col-sm-3 required">Type</label>
                            <div className="controls col-sm-6">
                                <input disabled="disabled" type="text" value={state.type} className="form-control" name="type" />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="control-label col-sm-3">Server</label>
                            <div className="col-sm-6">
                                <ServerTypeahead className="form-control" onChange={this._handleChangeServer} />
                                <span className="help-block">Server to provision volume to (optional)</span>
                            </div>
                        </div>

                        {state.owner_uuid ?
                            <div className="form-group form-group-network row">
                                <label className="control-label col-sm-3 required">Networks</label>

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
                            <div className="col-sm-offset-3 col-sm-6">
                                {state.creating ? <div className="loading"><i className="fa fa-spinner fa-spin"></i> Creating volume</div> :
                                    <div>
                                        <button disabled={!(state.name && state.owner_uuid && state.networks.length)}  className="btn btn-primary" onClick={this._handleSave} type="submit">Save Volume</button>
                                        <button className="btn btn-link" onClick={this._handleCancel} type="button">{this.props.cancelButton}</button>
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
            type: state.type,
            owner_uuid: state.owner_uuid,
            networks: state.networks
        };
        if (state.size) {
            data.size = state.size + state.sizeMeasure;
        }
        if (state.server) {
            data.server_uuid = state.server;
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
                this.props.handleSave(state);
            }
        }.bind(this));
    },
    _handleChangeName: function (e) {
        this.setState({name: e.target.value});
    },
    _handleChangeServer: function (server) {
        this.setState({server: server});
    },
    _handleChangeSize: function (e) {
        this.setState({size: e.target.value});
    },
    _handleChangeSizeMeasure: function (e) {
        this.setState({sizeMeasure: e.target.value});
    }
});

module.exports = VolumeForm;
