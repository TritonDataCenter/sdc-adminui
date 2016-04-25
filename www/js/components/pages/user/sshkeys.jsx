/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

/** @jsx React.DOM */

var BB = require('../../bb.jsx');
var React = require('react');
var SSHKeyForm = require('./sshkey-create');
var Backbone = require('backbone');
var $ = require('jquery');
var adminui = require('adminui');
var SSHKeyListItemTemplate = require('./sshkeys-list-item.hbs');
var SSHKeys = require('../../../models/sshkeys');
var SSHKey = require('../../../models/sshkey');

var SSHKeysPage = React.createClass({
    getInitialState: function () {
        return {
            keyForm: false
        };
    },
    componentWillMount: function () {
        this.sshKeys = new SSHKeys(null, {
            account: this.props.account,
            user: this.props.user
        });
        this.sshKeysList = new SSHKeysList({collection: this.sshKeys});

        this.view = new SSHKeysList({collection: this.sshKeys});
        this.sshKeys.fetch();
    },
    componentWillReceiveProps: function (props) {
        this.sshKeys.user = props.user;
        this.sshKeys.account = props.account;
        this.sshKeys.fetch();
    },
    _handleCancel: function () {
        this.setState({keyForm: false, keyFormError: false});
    },
    _handleNewKey: function () {
        this.setState({keyForm: true});
    },
    _handleSave: function (key) {
        var self = this;
        var sshKey = new SSHKey({
            account: this.props.account,
            user: this.props.user
        });
        sshKey.save(key).done(function (key) {
                key.user = self.props.user;
                self.sshKeys.add(key);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'SSH Key has been added to account.'
                });
                self.setState({keyForm: false});
            }).fail(function (xhr) {
                self.setState({keyFormError: xhr.responseData});
            }
        );
    },
    render: function () {
        return (<div className="user-sshKeys">
                <h3>SSH Keys
                    <div className="actions">
                        { !this.props.readonly && <button onClick={this._handleNewKey} className="btn btn-info btn-sm add-key"><i className="fa fa-plus"></i> Add Key</button> }
                    </div>
                </h3>
            {this.state.keyForm && <SSHKeyForm
                error={this.state.keyFormError}
                handleCancel={this._handleCancel}
                handleSave={this._handleSave} />}
                <div className="ssh-keys">
                    <div className="items"><BB view={this.view} /></div>
                </div>
            </div>);
    }
});

var SSHKeyListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'div',
    attributes: {'class':'item'},
    template: SSHKeyListItemTemplate,
    events: {
        'click .name a': 'showKey',
        'click .remove': 'onClickRemove'
    },
    showKey: function () {
        var modalHeader = $('<div class="modal-header"></div>');
        modalHeader.html('<h2 class="modal-title">' + this.model.get('name') + '</h2>');
        var modalBody = $('<div class="modal-body"></div>');
        var text = $('<textarea readonly>').html(this.model.get('openssh'));
        text.click(function () {
            $(this).select();
        });

        modalBody.append(text);

        var modal = $('<div id="sshkey-view">').addClass('modal');
        var dialog = $('<div class="modal-dialog"></div>');
        var content = $('<div class="modal-content"></div>');
        content.append(modalHeader);
        content.append(modalBody);
        content.append('<div class="modal-footer"><button class="btn btn-default" data-dismiss="modal">Close</button></div>');
        dialog.html(content);
        modal.html(dialog);
        modal.modal();
    },
    onClickRemove: function (e) {
        e.preventDefault();
        var confirm = window.confirm('Are you sure you want to remove this SSH Key?');
        if (confirm) {
            var model = this.model;
            var sshKey = model.toJSON();
            model.destroy({contentType: 'application/json', data: JSON.stringify(sshKey), wait: true}).done(function () {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: 'SSH Key removed successfully.'
                });
            }).fail(function (error) {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: 'Error deleting SSH Key. ' + (error.responseData.message || error.responseText || '')
                });
            });
        }
    }
});

var SSHKeyEmptyView = require('../../../views/empty').extend({
    emptyMessage: 'User has no SSH Keys.'
});

var SSHKeysList = Backbone.Marionette.CollectionView.extend({
    emptyView: SSHKeyEmptyView,
    itemView: SSHKeyListItem,
    itemViewOptions: function () {
        return {
            emptyViewModel: this.collection
        };
    }
});

module.exports = SSHKeysPage;
