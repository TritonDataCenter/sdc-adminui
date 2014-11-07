/** @jsx React.DOM */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var adminui = require('adminui');

var React = require('react');
var NicTags = require('../models/nictags');
var ErrorAlert = require('../components/error-alert');
var $ = require('jquery');
var api =require('../request');
var _ = require('underscore');

var NicTagsPage = React.createClass({
    getInitialState: function() {
        return {
            form: (this.props.form || false),
            formData: {}
        };
    },
    _showForm: function() {
        this.setState({form: true});
    },
    _hideForm: function() {
        this.setState({form: false});
    },
    handleSave: function(params) {
        api.post('/api/nic_tags').send(params).end(function(res) {
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
    render: function() {
        return <div className="nic-tags">
            <h3>Nic Tags
                <div className="actions">
                    <button className="btn btn-info" onClick={this._showForm}>
                        <i className="fa fa-plus"> New NIC Tag</i>
                    </button>
                </div>
            </h3>
            { this.state.error && <ErrorAlert error={this.state.error} /> }
            { this.state.form && <NicTagForm handleClose={this._hideForm} handleSave={this.handleSave}/> }
            { !this.state.form && <NicTagsList /> }
        </div>;
    }
});



var NicTagForm = React.createClass({
    getInitialState: function() {
        return {};
    },
    _onChangeName: function(e) {
        this.setState({name: e.target.value});
    },
    _onSave: function(e) {
        e.preventDefault();
        this.props.handleSave({name: this.state.name});
    },
    render: function() {
        return <div className="panel">
            <div className="panel-body">
                <h4 className="panel-title">New NIC Tag</h4>
                <form className="form form-horizontal">
                    <div className="form-group">
                        <label className="control-label col-sm-5">NIC Tag Name</label>
                        <div className="col-sm-5">
                            <input placeholder="name of NIC Tag (eg: acme-admin)" onChange={this._onChangeName} type="text" value={this.state.name} className="form-control" />
                        </div>
                    </div>
                    <div className="form-group">
                        <div className="col-sm-offset-5 col-sm-5">
                            <button disabled={ !(this.state.name && this.state.name.length) }  className="btn btn-primary" onClick={this._onSave} type="submit">Save NIC Tag</button>
                            <button className="btn btn-link" onClick={this.props.handleClose} type="button">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    }
});

var NicTagsList = React.createClass({
    getInitialState: function() {
        return {
            data: []
        };
    },
    componentWillMount: function() {
        var nicTags = new NicTags();
        var self = this;
        var promise = nicTags.fetch();
        $.when(promise).then(function() {
            self.setState({data: nicTags});
        });
    },
    onClick: function(nictag) {
        adminui.vent.trigger('showview', 'nictag', { model: nictag });
        return false;
    },
    render: function() {
        var nodes = this.state.data.map(function(nictag) {
            var nc = nictag.toJSON();
            var url = "/nictags/" + nc.name;
            return (
                <li key={nc.name}>
                    <a onClick={this.onClick.bind(this, nictag)} data-uuid={nc.name} href={url}>{nc.name}</a>
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
})

