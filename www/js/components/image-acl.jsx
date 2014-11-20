/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var React = require('react');
var $ = require('jquery');
var adminui = require('../adminui');

var User = require('../models/user');
var UserTile = React.createClass({
    propTypes: {
        uuid: React.PropTypes.string.isRequired
    },
    getInitialState: function() {
        return {
            loading: true
        };
    },
    componentDidMount: function() {
        var user = new User({uuid: this.props.uuid });
        var req = user.fetch();
        req.done(function(res, x, y) {
            this.setState({loading: false});
            this.setState(res);
        }.bind(this));

        req.error(function() {
            this.setState({
                loading: false,
                loadingFailed: true
            });
        }.bind(this));
    },
    navigateToUser: function(e) {
        e.preventDefault();
        adminui.vent.trigger('showcomponent', 'user', {uuid: this.props.uuid });
    },
    render: function() {
        var user = this.state;

        if (this.state.loading) {
            return <div className="user-tile loading" key={this.props.uuid}>
                Fetching User Information <span className="fa fa-spinner fa-spin"></span>
            </div>;
        }

        if (this.state.loadingFailed) {
            return <div className="user-tile failed" key={this.props.uuid}>
                <div className="row">

                    <div className="col-sm-1">&nbsp;</div>
                    <div className="col-sm-2">
                    { this.props.owner ? <span className="owner">owner</span> :''}
                    </div>
                    <div className="col-sm-9">
                        <span className="text-danger">Unable to fetch User Information.</span>
                        <span className="uuid">{this.props.uuid}</span>
                    </div>
                </div>
            </div>;
        }

        return (
            <div className="user-tile" key={this.props.uuid}>
                <div className="row">
                    <div className="col-sm-1">
                        <div className="user-icon" style={{
                            background: 'url(https://www.gravatar.com/avatar/'+user.emailhash+'?d=identicon&s=32)',
                            height: '32px',
                            width: '32px'
                        }}>
                        </div>
                    </div>
                    <div className="col-sm-2">
                        <a href={'/users/'+user.uuid} onClick={this.navigateToUser} className="login-link">
                            <span className="login">{user.login}</span>
                        </a>
                        { this.props.owner ? <span className="owner">owner</span> :''}
                    </div>
                    <div className="col-sm-5">
                            {user.cn ? user.cn : user.login }
                            {
                                user.company ? <span className="company"> @ {user.company}</span> : ''
                            }
                        <span className="uuid">{this.props.uuid}</span>
                    </div>
                    <div className="col-sm-4">
                        <div className="email"><strong>email</strong> {user.email}</div>
                    </div>
                </div>
            </div>
        );
    }
});

var TypeaheadUser = require('../views/typeahead-user');

var ImageAclForm = React.createClass({
    props: {
        handleAddAcl: React.PropTypes.func,
        handleCancel: React.PropTypes.func
    },
    componentDidMount: function() {
        this.typeAhead = new TypeaheadUser({el: $(this.refs.input.getDOMNode() )});
        this.typeAhead.on('selected', this.onSelectUser, this);
        this.typeAhead.render();
        this.refs.input.getDOMNode().focus();
    },
    onSelectUser: function(u) {
    },
    onCancel: function() {
        this.props.handleCancel();
    },
    onSubmit: function() {
        this.props.handleAddAcl(this.refs.input.getDOMNode().value);
    },
    componentDidUnmount: function() {
        this.typeAhead.off('selected');
    },
    render: function() {
        return (<div className="image-acl-form">
            <form className="form-horizontal" onSubmit={this.onSubmit}>
                <div className="form-group">
                    <div className="col-sm-8" style={{ paddingRight: 0 }}>
                        <input type="text" placeholder="Search for User by uuid, login, or email" ref="input" className="form-control user-select"/>
                    </div>
                    <div className="col-sm-4" style={{ paddingLeft: 0 }}>
                        <button type="button" onClick={this.onSubmit} className="btn btn-primary col-sm-6">Save</button>
                        <button type="button" onClick={this.onCancel} className="btn btn-link">Cancel</button>
                    </div>
                </div>
            </form>
        </div>);
    }
});

var ImageAcl = React.createClass({
    propTypes: {
        acl: React.PropTypes.array,
        public: React.PropTypes.bool.isRequired,
        owner: React.PropTypes.string,
        form: React.PropTypes.bool,
        readonly: React.PropTypes.bool,
        handleAddAcl: React.PropTypes.func,
        handleRemoveAcl: React.PropTypes.func,
        handleCancel: React.PropTypes.func
    },
    getDefaultProps: function() {
        return {
            acl: [],
            owner: null,
            form: false,
            readonly: false,
            handleAddAcl: function() {},
            handleRemoveAcl: function() {},
            handleCancel: function() {}
        };
    },
    onUserDetails: function(user) {
        adminui.vent.trigger('showcomponent', 'user', {uuid: user.uuid });
    },
    render: function() {
        var nodes = [];
        if (this.props.public) {
            nodes.push(<div key='public' className="acl-public">This image is available to everyone.</div>);
        } else if (this.props.owner) {
            nodes.push(<UserTile
                onUserDetails={this.onUserDetails}
                key={this.props.owner}
                uuid={this.props.owner} owner></UserTile>);

            if (this.props.acl.length) {
                this.props.acl.map(function(uuid) {
                    nodes.push(<UserTile key={uuid} uuid={uuid} />);
                    if (! this.props.readonly) {
                        nodes.push(<a className="remove-acl" data-uuid={uuid} onClick={this.props.handleRemoveAcl.bind(null, uuid)}><i className="fa fa-times"></i></a>);
                    }
                }, this);
            }
        }

        return (<div className="image-acl-component">
            <div className="image-acl-list">{nodes}</div>
            {
                this.props.form ? <ImageAclForm
                    handleCancel={this.props.handleCancel}
                    handleAddAcl={this.props.handleAddAcl} /> : ''
            }
            </div>);
    }
});

module.exports = ImageAcl;
