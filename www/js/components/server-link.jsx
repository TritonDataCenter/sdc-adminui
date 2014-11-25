/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */


"use strict";


var adminui = require('../adminui');
var Promise = require('promise');
var request = require('../request');
var React = require('react');
var _ = require('underscore');

var _getServerPromises = {};
function getServer(serverUuid) {
    var url = _.str.sprintf('/api/servers/%s', serverUuid);
    if (_getServerPromises[serverUuid]) {
        return _getServerPromises[serverUuid].p;
    } else {
        var r, p;
        p = new Promise(function(resolve, reject) {
            r = request.get(url).end(function(res) {
                if (res.ok) {
                    resolve(res.body);
                } else {
                    reject(res.body);
                }
            });
        });
        _getServerPromises[serverUuid] = {p: p, r: r};
        return _getServerPromises[serverUuid].p;
    }
}




var ServerName = React.createClass({
    displayName: 'ServerNameLink',
    propTypes: {
        serverUuid: React.PropTypes.string
    },
    componentWillMount: function() {
        getServer(this.props.serverUuid).then(function(server) {
            this.setState({server: server});
        }.bind(this));
    },
    componentWillUmount: function() {
        Object.keys(_getServerPromises).forEach(function(k) {
            _getServerPromises[k].r.abort();
        });
    },
    render: function() {
        if (!this.state || !this.state.server) {
            return null;
        }
        return <div className="server-name">
            <i className="fa fa-list"></i> <a href={'/servers/'+this.props.serverUuid} onClick={this.goToServer}>{this.state.server.hostname} </a>
        </div>;
    },
    goToServer: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', { uuid: this.props.serverUuid });
    },
});


module.exports = ServerName;
