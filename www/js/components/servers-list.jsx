/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var moment = require('moment');
var _ = require('underscore');
var BackboneMixin = require('./_backbone-mixin');
var adminui = require('../adminui');
var $ = require('jquery');
var React = require('react');

var Servers = require('../models/servers');
var ServerSetup = require('../views/server-setup');
var JSONEditor = require('../views/traits-editor');
var ServerMemoryUtilizationCircle = require('./pages/server/memory-utilization-circle');
var BatchJobProgress = require('./batch-job-progress');
var BatchJobConfirm = require('./batch-job-confirm');
var Modal = require('./modal');
var EditableField = require('./editable-field');

var ReservationRatioModal = React.createClass({
    propTypes: {
        items: React.PropTypes.array.isRequired
    },
    render: function () {
        var onClose = this.props.onClose || function () {};
        var onSave = this.props.onSave || function () {};
        return (
            <Modal id="batch-action-preview" onRequestHide={onClose} title="Change Reservation Ratio" ref="modal">
                <div className="modal-body">
                {
                    this.props.items.map(function (item) {
                        return <div className="item row" key={item.uuid}>
                            <div className="col-sm-2">
                                <span className={'state ' + item.status}>{item.status}</span>
                            </div>
                            <div className="col-sm-10">
                                <ul className="list-unstyled">
                                    <li className="alias">{item.hostname}</li>
                                    <EditableField value={item.reservation_ratio} title="Ratio" onSave={onSave} params={item.uuid}/>
                                </ul>
                                <div className="uuid">{item.uuid}</div>
                            </div>
                        </div>;
                    }, this)
                }
                </div>
                <div className="modal-footer">
                    <button type="button" onClick={onClose} className="btn btn-link">Close</button>
                </div>
            </Modal>
        );
    }
});

var ServersListItem = React.createClass({
    setup: function () {
        var view = new ServerSetup({model: this.props.server});
        view.render();
    },

    getInitialState: function () {
        return {selected: this.props.selected};
    },

    navigateToServerDetails: function (e) {
        if (e.metaKey) {
            return true;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', {server: this.props.server});
    },

    componentWillReceiveProps: function (nextProps) {
        this.setState({selected: nextProps.selected});
    },

    componentDidUpdate: function () {
        this.postRender();
    },

    componentDidMount: function () {
        this.postRender();
    },

    postRender: function () {
        var model = this.props.server;
        var $node = $(this.getDOMNode());
        $node.find('.last-platform').tooltip({
            title: _.str.sprintf('Platform Version', model.get('current_platform')),
            placement: 'top',
            container: 'body'
        });

        $node.find('.last-boot').tooltip({
            title: _.str.sprintf('Last boot at %s',
                moment(model.get('last_boot')).utc().format('LLL')),
            placement: 'top',
            container: 'body'
        });

        $node.find('.last-heartbeat').tooltip({
            title: _.str.sprintf('Last heartbeat at %s',
                moment(model.get('last_heartbeat')).utc().format('LLL')),
            placement: 'bottom',
            container: 'body'
        });
    },
    render: function () {
        var server = this.props.server.toJSON();
        server.last_boot = moment(server.last_boot).fromNow();
        server.last_heartbeat = moment(server.last_heartbeat).fromNow();
        server.memory_provisionable_mb = _.str.sprintf("%0.2f", server.memory_provisionable_bytes/1048576);
        server.memory_total_mb = _.str.sprintf("%0.2f", server.memory_total_bytes/1048576);
        server.memory_available_gb = _.str.sprintf("%0.2f", server.memory_available_bytes/1073741824);
        server.memory_provisionable_gb = _.str.sprintf("%0.2f", server.memory_provisionable_bytes/1073741824);
        server.memory_total_gb = _.str.sprintf("%0.2f", server.memory_total_bytes/1073741824);

        if (Number(server.memory_provisionable_mb) < 0) {
            server.memory_provisionable_mb = "0";
            server.memory_provisionable_gb = "0";
        }
        server.memory_total_provisionable_bytes = (server.memory_total_bytes * (1-server.reservation_ratio));
        server.memory_used_provisionable_bytes = (server.memory_total_provisionable_bytes - server.memory_provisionable_bytes);
        server.memory_utilization_percent = Math.round(server.memory_used_provisionable_bytes / server.memory_total_provisionable_bytes * 100);
        if (server.memory_utilization_percent < 0) {
            server.memory_utilization_percent = 0;
        }

        var traitsNodes = [];
        if (server.headnode) {
            traitsNodes.push(<span key="headnode" className="headnode">HEADNODE</span>);
        }

        if (server.traits.customer) {
            traitsNodes.push(<span key="customer" className="customer">CUSTOMER</span>);
        }

        Object.keys(server.traits).forEach(function (t) {
            if (server.traits[t] === true) {
                traitsNodes.push(<span key={t} className="trait">{t}</span>);
            }
        });

        return <div className="servers-list-item">
            {adminui.user.role('operators') && <div className='select'><input type="checkbox" onChange={this.props.onClick} className="input" checked={this.state.selected}/></div>}
            <div className={'status ' + server.status}></div>
            <div className={'data' + (adminui.user.role('operators') ? ' has-select' : '')}>
            <div className="name">
                <a onClick={this.navigateToServerDetails} href={'/servers/' + server.uuid}>{server.hostname}</a>
                {server.reserved && <span className="reserved"><i className="fa fa-lock"></i></span>}
                <span className="uuid"><span className="selectable">{server.uuid}</span></span>
                <div className="traits">{traitsNodes}</div>
            </div>

            {server.setup ?
                <div className="memory-usage">
                    <div className="memory-usage-graph-container">
                        {this.props.server.get('memory_provisionable_bytes') &&
                            <ServerMemoryUtilizationCircle diameter="80px" inner="23"
                            server={this.props.server} />
                        }
                    </div>
                    <div className="memory-usage-data">
                        <div className="memory-usage-avail">
                            <strong>Provisionable</strong>
                            <span className={'avail ' + ((server.memory_utilization_percent > 90) && 'full') }>{server.memory_provisionable_gb} GB</span>
                        </div>
                        <div className="memory-usage-total">
                            <strong>Total</strong>
                            <span className="total">{server.memory_total_gb} GB</span>
                        </div>
                        <div className="provisioning-state">
                            <strong>Provisioning</strong>
                            <span className={'state ' + (server.reserved ? 'disabled' : 'enabled') }>{server.reserved ? 'Disabled' : 'Enabled'}</span>
                        </div>
                    </div>
                </div>
                :
                <div className="setup-status">
                    {server.setting_up && 'Setting up'}
                    {!server.setting_up && adminui.user.role('operators') &&
                        <div>
                            <small className="requires-setup">Requires Setup</small>
                            <button onClick={this.setup} className="setup btn btn-info btn-sm setup"><i className="fa fa-magic"></i> Setup this Server</button>
                        </div>
                    }
                </div>
            }

            <div className="last-status">
                <div className="last-platform">
                    <strong><i className="fa fa-fw fa-location-arrow"></i></strong>
                    <span>{server.current_platform}</span>
                </div>

                <div className="last-boot">
                    <strong><i className="fa fa-fw fa-power-off"></i></strong> <span>{server.last_boot}</span>
                </div>
                <div className="last-heartbeat">
                    <strong><i className="fa fa-fw fa-heart"></i></strong> <span>{server.last_heartbeat}</span>
                </div>
            </div>
        </div>
    </div>;
    }
});

var ServersListComponent = React.createClass({
    getInitialState: function () {
        return {
            state: 'loading',
            selected: [],
            updateCollection: false
        };
    },
    componentWillMount: function () {
        if (this.props.params) {
            this.collection.params = this.props.params;
        }
    },

    componentDidMount: function () {
        this.collection = this.props.collection || new Servers();
        this.collection.fetch();

        this.collection.on('sync', this._onSync, this);
        this.collection.on('error', function () {
            this.setState({'state': 'error'});
        }, this);
    },

    _onSync: function () {
        var state = this.state;
        var selected = state.selected;
        var remaningSelected = [];
        if (selected.length && this.props.collection.length) {
            this.collection.each(function (model) {
                if (_.findWhere(selected, {uuid: model.id})) {
                    remaningSelected.push(model.toJSON());
                }
            });
        }
        this.setState({'state': 'done', selected: remaningSelected, updateCollection: !state.updateCollection});
    },

    handleSelect: function (uuid, e) {
        var selected = this.state.selected;
        var server = this.collection.get(uuid);
        if (e.target.checked) {
            selected.push(server.toJSON());
        } else {
            var index = _.findIndex(selected, {uuid: uuid});
            selected.splice(index, 1);
        }
        this.setState({selected: selected});
    },

    handleClearSelection: function () {
        this.setState({selected: []});
    },

    handleSelectAll: function (e) {
        this.setState({selected: e.target.checked ? this.collection.toJSON() : []});
    },

    isSelectedAll: function () {
        return this.state.selected.length === this.collection.length;
    },

    notificationSuccess: function (msg) {
        msg = msg || 'Servers updated';
        adminui.vent.trigger('notification', {
            level: 'success',
            message: msg
        });
    },

    handleAction: function (e) {
        var action = e.currentTarget.getAttribute('data-action');
        var selected = this.state.selected;
        if (action === 'reserve' || action === 'unreserve') {
            selected = selected.filter(function (item) {return !item.headnode;});
        }
        var selectedUuids = _.pluck(selected, 'uuid');

        var self = this;
        var confirm = {
            items: selected,
            state: 'status',
            alias: 'hostname',
            onClose: function () {
                self.setState({confirm: null});
            }
        };
        var actions = {
            reboot: function (uuids) {
                confirm.prompt = '!!!!!!! WARNING !!!!!!!! \n\nAre you sure you want to reboot server(s)? All customer zones will be rebooted';
                confirm.action = 'Reboot Server(s)';
                confirm.onConfirm = function () {
                    uuids.forEach(function (uuid) {
                        var server = self.collection.get(uuid);
                        server.reboot(function (job) {
                            adminui.vent.trigger('showjob', job);
                        });
                    });
                }.bind(self);
                self.setState({confirm: confirm});
            },
            modifyTraits: function (uuids) {
                var modal = new JSONEditor({
                    data: '',
                    title: 'Traits for server(s)'
                });
                modal.show();
                modal.on('save', function (data) {
                    var promises = [];
                    uuids.forEach(function (uuid) {
                        var server = self.collection.get(uuid);
                        promises.push(
                            server.save(
                                {traits: data},
                                {patch: true}).done()
                        );
                    });
                    $.when.apply(null, promises).done(function () {
                        modal.close();
                        self.notificationSuccess('Traits updated');
                    });
                }, this);
            },
            reserve: function () {
                    confirm.prompt = 'Are you sure you want to reserve server(s)?';
                    confirm.action = 'Reserve Server(s)';
                    confirm.showReservedStatus = true;
                    confirm.onConfirm = function () {
                        var collection = confirm.items.filter(function (item) {return !item.reserved;});
                        if (collection.length) {
                            var promises = [];
                            collection.forEach(function (item) {
                                var server = self.collection.get(item.uuid);
                                promises.push(
                                    server.save(
                                        {reserved: true},
                                        {patch: true}).done()
                                );
                            });
                            $.when.apply(null, promises).done(function () {
                                confirm.onClose();
                                self.notificationSuccess();
                            });
                        } else {
                            confirm.onClose();
                            self.notificationSuccess('All server(s) are already reserved');
                        }
                    }.bind(self);
                    self.setState({confirm: confirm});
            },
            unreserve: function () {
                confirm.prompt = 'Are you sure you want to un-reserve server(s)?';
                confirm.action = 'Un-reserve Server(s)';
                confirm.showReservedStatus = true;
                confirm.onConfirm = function () {
                    var collection = confirm.items.filter(function (item) {return item.reserved;});
                    if (collection.length) {
                        var promises = [];
                        collection.forEach(function (item) {
                            var server = self.collection.get(item.uuid);
                            promises.push(
                                server.save(
                                    {reserved: false},
                                    {patch: true}).done()
                            );
                        });
                        $.when.apply(null, promises).done(function () {
                            confirm.onClose();
                            self.notificationSuccess();
                        });
                    } else {
                        confirm.onClose();
                        self.notificationSuccess('All server(s) are already un-reserved');
                    }
                }.bind(self);
                self.setState({confirm: confirm});
            },
            modifyRatio: function () {
                var modal = {
                    items: selected.filter(function (item) {return !item.headnode;}),
                    onClose: function () {
                        self.setState({modalRatio: null});
                    },
                    onSave: function (value, uuid, callback) {
                        var server = self.collection.get(uuid);
                        if (server) {
                            server.save({reservation_ratio: Number(value)}, {patch: true}).done(callback);
                        } else {
                            return callback();
                        }
                    }
                };
                self.setState({modalRatio: modal});
            }
        };
        if (actions[action] && typeof actions[action] === 'function') {
            actions[action](selectedUuids);
        }
    },

    renderActionBar: function () {
        var numSelectedServers = this.state.selected.length;
        var hasNotOnlyHeadnodeSelection = this.state.selected.some(function (item) {return !item.headnode;});
        return <div className="actionbar row">
            <div className="actionbar-items col-sm-3">
            {numSelectedServers} server{numSelectedServers > 1 ? 's' : ''} selected
            </div>
            <div className="actionbar-actions col-sm-7">
                <a data-action="reboot" onClick={this.handleAction}><i className="fa fa-fw fa-refresh" /> Reboot</a>
                {hasNotOnlyHeadnodeSelection && <a data-action="reserve" onClick={this.handleAction}><i className="fa fa-lock" /> Reserve</a>}
                {hasNotOnlyHeadnodeSelection && <a data-action="unreserve" onClick={this.handleAction}><i className="fa fa-unlock" /> Un-reserve</a>}
                <a data-action="modifyTraits" onClick={this.handleAction}><i className="fa fa-pencil" /> Replace Traits</a>
                {hasNotOnlyHeadnodeSelection && <a data-action="modifyRatio" onClick={this.handleAction}><i className="fa fa-pencil" /> Modify Reservation Ratio</a>}
            </div>
            <div className="actionbar-clear col-sm-2">
                <a onClick={this.handleClearSelection}><i className="fa fa-times" /> Clear</a>
            </div>
        </div>;
    },

    render: function () {
        var state = this.state.state;
        if (state === 'loading' || state === 'error') {
            return <div className="servers-list"><div className="zero-state">{state === 'error' ? 'Error ' : ''}Retrieving Servers List</div></div>
        } else {
            return  <div className="servers-list">
                <div className="server-list-header">
                    {adminui.user.role('operators') && <div className="select"><input onChange={this.handleSelectAll} type="checkbox" checked={this.isSelectedAll()} className="input" /></div>}
                    <div className="title">
                        Showing {this.collection.length} Server{this.collection.length > 1 && 's'}<br/>
                    </div>
                </div>
                {adminui.user.role('operators') && this.state.selected.length ? this.renderActionBar() : null}
                {this.state.confirm && <BatchJobConfirm {...this.state.confirm} />}
                {this.state.modalRatio && <ReservationRatioModal {...this.state.modalRatio} />}
                {this.collection.map(function (server) {
                    var uuid = server.get('uuid');
                    var boundClick = this.handleSelect.bind(this, uuid);
                    var selected = _.findWhere(this.state.selected, {uuid: uuid});
                    return (
                        <ServersListItem onClick={boundClick} key={uuid} server={server} selected={!!selected} update={this.state.updateCollection} />
                    );
                }, this)}
            </div>;
        }
    }
});

module.exports = ServersListComponent;
