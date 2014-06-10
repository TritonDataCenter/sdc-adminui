/** @jsx React.DOM */

var React = require('react');
var User = require('../models/user');
var UserLink = module.exports = React.createClass({
    getInitialState: function() {
        return {
            user: {},
            loaded: false
        };
    },
    componentDidMount: function() {
        var user = this.user = new User({uuid: this.props.uuid});
        var self = this;
        var req = this.user.fetch();
        req.done(function() {
            self.setState({user: user, loaded: true});
        });
    },
    handleClick: function() {
        if (this.props.handleClick) {
            this.props.handleClick(this.state.user);
        }
    },
    render: function() {
        if (this.state.loaded) {
            var user = this.state.user.toJSON();
            return <a className="user-link-component" onClick={this.handleClick} href={"/users/" + this.props.uuid}>{user.cn}</a>
        } else {
            return <a className="user-link-component loading" onClick={this.handleClick} href={"/users/" + this.props.uuid}>Loading</a>
        }
    }
});
