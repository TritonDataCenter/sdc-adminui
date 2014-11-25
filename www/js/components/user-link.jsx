/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/** @jsx React.DOM */

var React = require('react');
var User = require('../models/user');

var UserLink =  React.createClass({
    propTypes: {
        'userUuid': React.PropTypes.string.isRequired,
        'handleClick': React.PropTypes.func
    },
    getInitialState: function() {
        return {
            user: {},
            loaded: false
        };
    },
    componentDidMount: function() {
        var user = this.user = new User({uuid: this.props.userUuid});
        var self = this;
        var req = this.user.fetch();
        req.done(function() {
            self.setState({user: user, loaded: true});
        });
    },
    handleClick: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        if (this.props.handleClick) {
            this.props.handleClick(this.user);
        }
    },
    render: function() {
        var userIcon = this.props.icon ? <i className="fa fa-user fa-fw"></i> : null;

        if (this.state.loaded) {
            var user = this.state.user.toJSON();
            var company = this.props.company && user.company && user.company.length ?
                <div className="user-link-company">
                    { this.props.icon ? <span className="fa fa-building fa-fw"></span> : null}
                    <div className="owner-company">{user.company}</div>
                </div> : null;


            return <div className="user-link-component">
                { userIcon }
                <a onClick={this.handleClick} href={"/users/" + this.props.userUuid}>{user.cn}</a>
                { company }
            </div>;
        } else {
            return <div className="user-link-component loading">
                { userIcon }
                <a onClick={this.handleClick} href={"/users/" + this.props.userUuid}>Loading</a>
            </div>;
        }
    }
});

module.exports = UserLink;
