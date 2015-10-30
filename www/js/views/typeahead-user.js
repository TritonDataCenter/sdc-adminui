/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var Backbone = require('backbone');
var Bloodhound = require('bloodhound');
var app = require('adminui');

var User = require('../models/user');
var UserPreview = require('./user-preview');
var $ = require('jquery');

var UserTypeaheadTpl = require('../tpl/typeahead-user-select.hbs');

var UserTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'blur :el': 'onBlur',
        'typeahead:selected': 'onTypeaheadSelect',
        'typeahead:opened': 'onOpened',
        'typeahead:closed': 'onTypeaheadClosed',
        'typeahead:cursorchanged': 'onCursorChanged'
    },

    template: UserTypeaheadTpl,

    initialize: function (options) {
        options = options || {};
        this.elemValue = this.$el.val();
        this.selectedUser = null;
        this.preSelectedUser = options.preSelectedUser;
    },

    onTypeaheadSelect: function (e, datum) {
        console.debug('typeahead selected', e, datum);
        this.$el.tooltip('destroy');
        this.selectedUser = datum.model;
        this.trigger('selected', datum.model);
        if (this.options.showPreview) {
            this.$el.after(new UserPreview({
                model: datum.model,
                previewType: this.options.previewType || 'short'
            }).render().el);
        }
    },

    clearField: function (force) {
        process.nextTick(function () {
            this.$el.val(force ? '' : this.elemValue);
        }.bind(this));
    },

    onOpened: function () {
        var user = this.preSelectedUser || this.$el.val();
        this.selectedUser = user;
        this.trigger('opened', user);
    },

    onTypeaheadClosed: function (e, suggestion, dataset) {
        console.debug('typeahead closed');
        var $field = this.$el;
        var value = $field.val();
        var selectedUser = this.selectedUser;
        if ((typeof selectedUser === 'object' && selectedUser.get && selectedUser.get('uuid') || selectedUser) !== value) {
            if (value.length !== 36 && this.options.showPreview) {
                this.$el.parent().find('.user-preview').remove();
            } else {
                this.trigger('selected', value);
            }
        }
    },

    initializeEngine: function () {
        var self = this;
        var url = this.options.accountsOnly ? '/api/users?accountsonly=true&q=%QUERY' : '/api/users?q=%QUERY';
        this.engine = new Bloodhound({
            limit: 25,
            name: 'users',
            remote: {
                url: url,
                ajax: {
                    beforeSend: function (xhr) {
                        if (!this.headers['x-adminui-token'] && app.user && app.user.getToken()) {
                            xhr.setRequestHeader('x-adminui-token', app.user.getToken());
                        }
                        self.showLoading();
                    }
                },
                filter: function (users) {
                    self.hideLoading();
                    var datums = users.map(function (user) {
                        return {
                            model: new User(user),
                            'uuid': user.uuid,
                            'name': user.cn,
                            'login': user.login,
                            'alias': user.alias,
                            'email': user.email
                        };
                    });
                    return datums;
                }
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            datumTokenizer: function (user) {
                return [user.login, user.uuid, user.email];
            }
        });
        this.engine.initialize();
        this.$el.typeahead({
            name: 'users',
            minLength: 1,
            highlight: true
        }, {
            displayKey: 'uuid',
            name: 'users',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: UserTypeaheadTpl
            }
        });
        if (this.preSelectedUser) {
            this.$el.typeahead('val', this.preSelectedUser);
            this.preSelectedUser = '';
            this.$el.typeahead('close');
        }
    },

    showLoading: function () {
        var typeaheadLoading = this.$el.parent().parent().find('.tt-loading');
        if (typeaheadLoading.length) {
            typeaheadLoading.show();
        } else {
            this.$el.parent().after("<div class='tt-loading'>Loading</div>");
        }
    },

    hideLoading: function () {
        this.$el.parent().parent().find(".tt-loading").hide();
    },

    render: function () {
        this.initializeEngine();
    },
    remove: function () {
        this.$el.typeahead('destroy');
        return Backbone.Marionette.View.prototype.remove.call(this);
    }
});

module.exports = UserTypeaheadView;