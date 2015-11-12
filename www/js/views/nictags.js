/** @jsx React.DOM */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var adminui = require('adminui');

var React = require('react');
var NicTags = require('../models/nictags');
var ErrorAlert = require('../components/error-alert');
var $ = require('jquery');
var api =require('../request');
var _ = require('underscore');
var NicTagForm = require('./nictag-form');
var app = require('../adminui');

var NicTagsPage = React.createClass({
    getInitialState: function () {
        return {
            form: (this.props.form || false),
            formData: {}
        };
    },
    _showForm: function () {
        this.setState({form: true});
    },
    _hideForm: function () {
        this.setState({form: false});
    },
    setError: function (err) {
        this.setState({error: err});
    },
    handleSave: function (params) {
        params.mtu = /^[0-9]+$/.test(params.mtu) ? parseInt(params.mtu, 10) : params.mtu;
        api.post('/api/nic_tags').send(params).end(function (res) {
            if (res.error) {
                this.setState({error: res.body});
                return;
            }
            if (res.ok) {
                this.setState({error: null, form: false});
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('NIC Tag <strong>%s</strong> created successfully', params.name)
                });
            }
        }.bind(this));
    },
    render: function () {
        return <div className="nic-tags">
            <h3>NIC Tags
                <div className="actions">
                    {app.user.role('operators') &&  
                    <button className="btn btn-sm btn-info" onClick={this._showForm}>
                        <i className="fa fa-plus"></i>
                        &nbsp;New NIC Tag
                    </button>}
                </div>
            </h3>
            {this.state.error && <ErrorAlert error={this.state.error} />}
            {this.state.form && <NicTagForm handleClose={this._hideForm} handleSave={this.handleSave} />}
            {!this.state.form && <NicTagsList handleError={this.setError} />}
        </div>;
    }
});

var NicTagsList = React.createClass({
    getInitialState: function () {
        return {
            data: []
        };
    },
    componentWillMount: function () {
        var self = this;
        this.nicTags = new NicTags();
        var promise = this.nicTags.fetch();
        $.when(promise).then(function () {
            self.setState({data: self.nicTags});
        });
    },
    onClick: function (nictag) {
        adminui.vent.trigger('showview', 'nictag', {model: nictag});
        return false;
    },
    onClickDeleteNicTag: function (nictag) {
        var self = this;
        var confirm = window.confirm(
            _.str.sprintf('Are you sure you want to delete the NIC tag "%s" ?', nictag.name)
        );
        if (confirm) {
            api.del('/api/nic_tags/' + nictag.name).end(function (res) {
                if (res.error) {
                    self.props.handleError(res.body);
                    return;
                }
                if (res.ok) {
                    self.nicTags.fetch().done(function () {
                        self.props.handleError(null);
                        self.setState({data: self.nicTags});
                    });

                    adminui.vent.trigger('notification', {
                        level: 'success',
                        message: _.str.sprintf('NIC tag <strong>%s</strong> deleted successfully', nictag.name)
                    });
                }
            }.bind(this));
        }
    },
    render: function () {
        var nodes = this.state.data.map(function (nictag) {
            var nc = nictag.toJSON();
            var url = "/nictags/" + nc.name;
            return (
                <li key={nc.name}>
                    <a onClick={this.onClick.bind(this, nictag)} data-uuid={nc.name} href={url}>{nc.name}</a><br/><span className="mtu">mtu: {nc.mtu}</span>
                    {app.user.role('operators') &&
                    <div className="actions">
                        <a onClick={this.onClickDeleteNicTag.bind(this, nc)} className="delete-nictag"><i className="fa fa-trash-o"></i> Delete</a>
                    </div>}
                </li>
                );
        }, this);
        return (<div className="nictags-component"><ul className="list-unstyled">{nodes}</ul></div>);
    }
});


module.exports = Backbone.Marionette.View.extend({
    sidebar: 'networking',
    onShow: function() {
        var Page = React.createFactory(NicTagsPage);
        React.render(Page(), this.$el.get(0));
        return this;
    }
});

