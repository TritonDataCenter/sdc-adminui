/** @jsx React.DOM */

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
var $ = require('jquery');

var Ip = React.createClass({
    getInitialState: function () {
        return {
            isLoaded: true,
            ip: '',
            error: ''
        };
    },
    onBlur: function () {
        var self = this;
        var $field = $(React.findDOMNode(this.refs.ipsFilter));
        var ip = $field.val();
        var ipParts = ip.split('.');
        var done = function (error) {
            self.props.onChange(!error ? ip : '');
            self.setState({
                isLoaded: true,
                error: error || ''
            });
        };
        if (ipParts.length === 4 && ipParts[3].length) {
            this.setState({
                isLoaded: false
            });
            var error = '';
            $.get('/api/networks/' + this.props.uuid + '/ips/' + ip).done(function (address) {
                if (!address.free || address.reserved) {
                    error = 'IP is already in use or reserved';
                }
                done(error);
            }).fail(function (res) {
                try {
                    error = JSON.parse(res.responseText).message;
                } catch (ex) {
                    error = '';
                }
                done(error);
            });
        } else {
            done(ip.length ? 'Invalid IP address' : '');
        }
    },
    onFocus: function () {
        this.setState({error: ''});
    },
    onChange: function (e) {
        this.setState({
            ip: e.target.value
        });
    },
    render: function () {
        return (
            <div>
                {!this.state.isLoaded && (<div className="loading"><i className="fa fa-spinner fa-spin"></i> Check Network IP</div>)}
                {this.state.isLoaded && (<input
                    className="form-control"
                    type="text"
                    placeholder="automatic"
                    ref="ipsFilter"
                    value={this.state.ip}
                    onChange={this.onChange}
                    onFocus={this.onFocus}
                    onBlur={this.onBlur} />)}
                {this.state.error && (<p className="text-danger">{this.state.error}</p>)}
            </div>
        );
    }
});

module.exports = Ip;
