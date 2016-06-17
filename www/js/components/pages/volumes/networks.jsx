/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var React = require('react');
var NetworksList = require('../networking/networks-list');
var Networks = require('../../../models/networks');

var VolumeNetworksList = React.createClass({
    propTypes: {
        networks: React.PropTypes.array.isRequired
    },
    getInitialState: function () {
        return {
            loading: true,
            networkFilters: this.props.owner ? {provisionable_by: this.props.owner} : {}
        };
    },
    componentDidMount: function () {
        var networks = new Networks();
        var self = this;
        var req = networks.fetch({params: this.state.networkFilters});
        req.fail(function (xhr) {
            self.setState({
                loading: false,
                error: xhr.responseText
            });
        });

        req.done(function () {
            networks.reset(networks.fullCollection.filter(function (network) {
                return self.props.networks.indexOf(network.get('uuid')) !== -1;
            }));
            self.setState({
                error: null,
                loading: false,
                networks: networks
            });
        });
    },
    render: function () {
        if (this.state.loading) {
            return <div className="volume-networks">
                <div className="loading">
                    <i className="fa fa-circle-o-notch fa-spin" /> Fetching Networks
                </div>
            </div>;
        }

        if (this.state.error) {
            return <div className="volume-networks">
                <div className="loading error">
                    <h1><i className="fa fa-warning" /> Failed to retrieve networks.</h1>
                    <p><code>{this.state.error}</code></p>
                </div>
            </div>;
        }

        return <div className="volume-networks">
            <h3>Networks</h3>
            <NetworksList
                collection={this.state.networks}
                showActions={false} />
        </div>;
    }
});

module.exports = VolumeNetworksList;

