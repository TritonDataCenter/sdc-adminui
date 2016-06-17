/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var React = require('react');
var _ = require('underscore');
var adminui = require('../../../adminui');
var utils = require('../../../lib/utils');
var UserLink = require('../../user-link');
var User = require('../../../models/user');
var BB = require('../../bb');
var PaginationView = require('../../../views/pagination');
var JSONExport = require('../../json-export');
var Volumes = require('../../../models/volumes');
var Promise = require('promise');

var NOT_AVAILABLE = 'N/A';
var NOT_EXPORTED_OWNER_FIELDS = [
    'controls',
    'memberof',
    'dn',
    'pwdchangedtime',
    'pwdendtime',
    'registered_developer',
    'approved_for_provisioning',
    'memberof',
    'objectclass'
];
var usersCache = {};

var fetchOwner = function (owner_uuid) {
    return new Promise(function (resolve) {
        if (usersCache[owner_uuid]) {
            resolve(usersCache[owner_uuid]);
            return;
        }

        var user = new User({uuid: owner_uuid});
        user.fetch().done(function () {
            usersCache[owner_uuid] = user;
            resolve(user);
        }).fail(function () {
            resolve({});
        });
    });
};

var VolumesList = React.createClass({
    getInitialState: function () {
        var state = {
            volumes: this.props.volumes || new Volumes()
        };
        state.loading = !state.volumes.fetched;
        return state;
    },
    componentDidMount: function () {
        var volumes = this.state.volumes;
        volumes.on('reset', this.onSync, this);
        volumes.on('add', this.onSync, this);
        volumes.on('remove', this.onSync, this);
        volumes.on('error', function (model, xhr) {
            var errorDetails = '';
            if (xhr.statusText === 'timeout') {
                errorDetails = 'Connection timed out - please try again.';
            } else {
                try {
                    errorDetails = JSON.parse(xhr.responseText).message;
                } catch (ex) {
                    errorDetails = ex;
                }
            }
            adminui.vent.trigger('notification', {
                level: 'error',
                message: 'Failed to fetch volumes: ' + errorDetails
            });
            this.setState({loading: false});
        }, this);
    },
    onSync: function () {
        var self = this;
        var volumes = this.state.volumes;
        var owners = _.uniq(_.pluck(volumes.toJSON(), 'owner_uuid'));
        Promise.all(owners.map(fetchOwner)).done(function (owners) {
            self.setState({volumes: volumes, owners: owners, loading: false});
        });
    },
    showVolume: function (volume) {
        adminui.vent.trigger('showcomponent', 'volume', {volume: volume});
    },
    navigateToOwnerDetailsPage: function (user) {
        adminui.vent.trigger('showcomponent', 'user', {user: user});
    },
    deleteVolume: function (model, event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        var volume = model.toJSON();
        var confirm = window.confirm(
            _.str.sprintf('Are you sure you want to delete the volume "%s" ?', volume.name)
        );
        if (confirm) {
            var self = this;
            model.set({'deleting': true});
            this.setState({volumes: self.state.volumes});
            model.destroy({contentType: 'application/json', data: JSON.stringify(volume), wait: true}).done(function () {
                var notifyMsg = _.str.sprintf('Volume <strong>%s</strong> has been deleted successfully.', volume.name);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: notifyMsg
                });
            }).fail(function (error) {
                model.set({'deleting': false});
                self.setState({volumes: self.state.volumes});
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: error.responseData.message
                });
            });
        }
    },
    renderVolume: function (model) {
        var volume = model.toJSON();
        var state = volume.state || null;

        var actions = volume.deleting ?
            (<td className="status">
                <div className="loading"><i className="fa fa-spinner fa-spin"></i> Deleting</div>
            </td>) :
            (<td className="actions">
                <a onClick={this.deleteVolume.bind(this, model)} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
            </td>);

        return (
            <tr key={volume.uuid}>
                {state ?
                    <td className="status">
                            <span className={'state ' + state}>{state}</span>
                    </td> : null
                }    
                <td className="name">
                    <a onClick={this.showVolume.bind(this, model)}>{volume.name || volume.uuid}</a>
                    <span className="uuid">{volume.uuid}</span>
                </td>
                <td className="size">
                    {volume.reserved_size / 1024} GB
                </td>
                <td className="type">
                    {volume.type}
                </td>
                <td className="owned-by">
                    <div className="owner">
                        <UserLink icon company user={usersCache[volume.owner_uuid]} userUuid={volume.owner_uuid}
                                  handleClick={this.navigateToOwnerDetailsPage} />
                    </div>
                </td>
                {this.props.showActions && adminui.user.role('operators') && actions}
            </tr>
        );
    },
    handleExport: function () {
        var state = this.state;
        var volumes = state.volumes.toJSON();
        var owners = state.owners;
        var volumesGroupedByOwner = _.groupBy(volumes, function (volume) {
            return volume.owner_uuid;
        });
        var exported = owners.map(function (owner) {
            owner = owner.toJSON();
            if (owner.cn !== NOT_AVAILABLE) {
                NOT_EXPORTED_OWNER_FIELDS.forEach(function (key) {
                    delete owner[key];
                });
                owner.created_at = new Date(Number(owner.created_at));
                owner.updated_at = new Date(Number(owner.updated_at));
            }
            owner.volumes = volumesGroupedByOwner[owner.uuid];
            return owner;
        });
        this.setState({exported: exported});
    },
    handleCloseExport: function () {
        this.setState({exported: false});
    },
    render: function () {
        var volumes = this.state.volumes;
        if (this.state.loading) {
            return (
                <div className="volumes-list">
                    <div className="zero-state">Retrieving Volumes</div>
                </div>
            );
        }

        if (!volumes.length) {
            return (
                <div className="volumes-list">
                    <div className="zero-state">No Volumes were found matching specified criteria</div>
                </div>
            );
        }

        return (
            <div className="volumes-list">
                <div className="volumes-list-header list-header">
                    <div className="title">
                        Showing <span className="current-count">{volumes.length}</span> of <span className="record-count">{volumes.objectCount}</span> Volumes<br/>
                    </div>
                    <div className="actions">
                        <a onClick={this.handleExport} className="export">Export (<span className="record-count">{volumes.length}</span>) <i className="fa fa-share-square"></i></a>
                    </div>
                </div>
                <table className="table">
                    <tbody>{volumes.map(this.renderVolume, this)}</tbody>
                </table>
                <BB view={new PaginationView({collection: volumes})} />
                {
                    this.state.exported ? <div className="export-container">
                        <JSONExport description="Volumes grouped by owner" data={this.state.exported} onRequestHide={this.handleCloseExport} />
                    </div> : null
                }
            </div>
        );
    }
});

module.exports = VolumesList;
