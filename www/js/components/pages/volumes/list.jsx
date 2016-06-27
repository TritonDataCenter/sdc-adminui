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
var BB = require('../../bb');
var PaginationView = require('../../../views/pagination');

var Volumes = require('../../../models/volumes');

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
        volumes.on('sync', this.onSync, this);
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
        this.setState({volumes: this.state.volumes, loading: false});
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
        volume.state = volume.state || 'unknown';
        return (
            <tr key={volume.uuid}>
                <td className="status">
                    {volume.deleting ?
                        <div className="loading"><i className="fa fa-spinner fa-spin"></i> Deleting</div> :
                        <span className={'state ' + volume.state}>{volume.state}</span>
                    }
                </td>
                <td className="name">
                    <a onClick={this.showVolume.bind(this, model)}>{volume.name || volume.uuid}</a>
                </td>
                <td className="type">
                    {volume.type}
                </td>
                <td className="owned-by">
                    <div className="owner">
                        <UserLink icon company userUuid={volume.owner_uuid} handleClick={this.navigateToOwnerDetailsPage} />
                    </div>
                </td>
                {this.props.showActions && adminui.user.role('operators') ?
                    (<td className="actions">
                        {!volume.deleting &&
                            <a onClick={this.deleteVolume.bind(this, model)} className="delete"><i className="fa fa-trash-o"></i> Delete</a>
                        }
                    </td>)
                    : null}
            </tr>
        );
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
                </div>
                <table className="table">
                    <tbody>{volumes.map(this.renderVolume, this)}</tbody>
                </table>
                <BB view={new PaginationView({collection: volumes})} />
            </div>
        );
    }
});

module.exports = VolumesList;
