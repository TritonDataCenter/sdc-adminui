/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

'use strict';

var React = require('react');
var adminui = require('../../../adminui');
var VolumeModel = require('../../../models/volume');
var VolumeNetworks = require('./networks');
var UserTile = require('../../user-tile');

var VolumePage = React.createClass({
    statics: {
        sidebar: 'volumes',
        url: function (props) {
            var data = props.uuid || props.volume;

            if (data && typeof data === 'object') {
                data = data.get('uuid');
            }

            return _.str.sprintf('/volumes/%s', data);
        }
    },
    getInitialState: function () {
        var volume = this.props.volume;
        var isVolumeObject = volume && typeof volume === 'object';
        return {
            volume: isVolumeObject ? volume : new VolumeModel({uuid: this.props.uuid || volume}),
            loading: !isVolumeObject
        };
    },
    componentDidMount: function () {
        if (this.state.loading) {
            this.fetchVolume();
        }
    },
    fetchVolume: function () {
        var req = this.state.volume.fetch();
        req.fail(function (xhr) {
            this.setState({
                loading: false,
                error: xhr.responseText,
                volume: this.state.volume
            });
        }.bind(this));

        req.done(function () {
            this.setState({
                error: null,
                loading: false,
                volume: this.state.volume
            });
        }.bind(this));
    },
    render: function () {
        if (this.state.loading) {
            return <div id="page-user">
                <div className="loading">
                    <i className="fa fa-circle-o-notch fa-spin" /> Fetching Volume
                </div>
            </div>;
        }

        if (this.state.error) {
            return <div id="page-user">
                <div className="loading error">
                    <h1><i className="fa fa-warning" /> Volume can not be retrieved</h1>
                    <p><code>{this.state.error}</code></p>
                </div>
            </div>;
        }

        if (!this.state.volume) {
            return <div id="page-volume">
                <div className="page-header">
                    <h2>Volume Not Found</h2>
                </div>
                <p>The Volume with ID <code>{this.props.uuid}</code> can not be found.</p>
            </div>;
        }

        var volume = this.state.volume.toJSON();
        volume.state = volume.state || 'unknown';

        return <div id="page-volume">
            <div className="page-header">
                <div className="resource-status"><span className={'volume-state ' + volume.state}>{volume.state}</span></div>
                <h1>
                    <span className="volume-alias">{volume.name || volume.uuid}</span>&nbsp;
                </h1>
            </div>
            <section className="volume-details">
                <div className="row">
                    <div className="col-md-9">
                        <table className="overview">
                            <tr>
                                <th>Name</th>
                                <td>
                                    <span className="alias">
                                        <form className="form-inline"></form>
                                        <span className="value volume-alias">{volume.name || volume.uuid}</span>
                                    </span>
                                </td>
                            </tr>

                            <tr>
                                <th>Type</th>
                                <td>
                                    <span className="volume-type">{volume.type}</span>
                                </td>
                            </tr>

                            {volume.nfs_path ?
                                <tr>
                                    <th>NFS path</th>
                                    <td className="nfs-path">{volume.nfs_path}</td>
                                </tr>
                                : null
                            }

                            {volume.filesystem_path ?
                                <tr>
                                    <th>FS path</th>
                                    <td className="nfs-path">{volume.filesystem_path}</td>
                                </tr>
                                : null
                            }

                            {volume.size ?
                                <tr>
                                    <th>Size</th>
                                    <td className="size">{volume.size}</td>
                                </tr>
                                : null
                            }
                        </table>
                        {volume.tags && <div>
                            <h3>Tags</h3>
                            <div className="tags-container"><Metadata metadata={volume.tags} /></div>
                        </div>}
                    </div>
                    <div className="col-md-3">
                        <div className="user-tile-icon">
                            <i className="fa fa-user"></i>
                        </div>
                        <div className="user-tile-container">
                            <UserTile uuid={volume.owner_uuid} onUserDetails={
                                function (user) { adminui.vent.trigger('showcomponent', 'user', {uuid: user.uuid }); }
                                } />
                        </div>
                    </div>
                </div>
            </section>

            {volume.networks && volume.networks.length ?
                <section>
                    <div className="row">
                        <div className="col-md-12">
                            <div className="network-region">
                                <VolumeNetworks networks={volume.networks} owner={volume.owner_uuid} />
                            </div>
                        </div>
                    </div>
                </section> : null
            }

        </div>;
    }
});

module.exports = VolumePage;
