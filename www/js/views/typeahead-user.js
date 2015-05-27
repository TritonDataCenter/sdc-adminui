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

    initialize: function(options) {
        options = options || {};
        this.elemValue = this.$el.val();
        this.selectedUser = null;
    },

    onTypeaheadSelect: function(e, datum) {
        console.debug('typeahead selected', e, datum);
        this.$el.tooltip('destroy');
        this.selectedUser = datum.model;
        this.trigger('selected', datum.model);
        if (this.options.showPreview) {
            this.$el.after(new UserPreview({model: datum.model, previewType: this.options.previewType || 'short'}).render().el);
        }
    },

    clearField: function(force) {
        process.nextTick(function() {
            this.$el.val(force ? '' : this.elemValue);
        }.bind(this));
    },

    onOpened: function() {
        this.selectedUser = null;
        this.trigger('selected', null);
    },

    onTypeaheadClosed: function(e, suggestion, dataset) {
        console.debug('typeahead closed');
        var $field = this.$el;

        if (this.selectedUser && $field.val() === this.selectedUser.get('uuid')) {
            return;
        }

        if ($field.val().length !== 36 && this.options.showPreview) {
            this.$el.parent().find('.user-preview').remove();
        }
    },

    initializeEngine: function() {
        var self = this;
        var url = this.options.accountsOnly ? '/api/users?accountsonly=true&q=%QUERY' : '/api/users?q=%QUERY';
        this.engine = new Bloodhound({
            limit: 25,
            name: 'users',
            remote: {
                url: url,
                ajax: {
                    beforeSend: function(xhr) {
                        if (!this.headers['x-adminui-token'] && app.user && app.user.getToken()) {
                            xhr.setRequestHeader('x-adminui-token', app.user.getToken());
                        }
                        self.showLoading();
                    }
                },
                filter: function(users) {
                    self.hideLoading();
                    var datums = users.map(function(u) {
                        return {
                            model: new User(u),
                            'uuid': u.uuid,
                            'name': u.cn,
                            'login': u.login,
                            'alias': u.alias,
                            'email': u.email
                        };
                    });
                    return datums;
                }
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            datumTokenizer: function(u) {
                return [u.login, u.uuid, u.email];
            }
        });
        this.engine.initialize();
        this.$el.typeahead({
                name: 'users',
                minLength: 1,
                highlight: true
            },
            {
                displayKey: 'uuid',
                name: 'users',
                source: this.engine.ttAdapter(),
                templates: {
                    suggestion: UserTypeaheadTpl
                }
            });
    },

    showLoading: function() {
        if (this.$el.parent().parent().find('.tt-loading').length) {
            this.$el.parent().parent().find(".tt-loading").show();
        } else {
            this.$el.parent().after("<div class='tt-loading'>Loading</div>");
        }
    },

    hideLoading: function() {
        this.$el.parent().parent().find(".tt-loading").hide();
    },

    render: function() {
        this.initializeEngine();
    },
    remove: function() {
        this.$el.typeahead('destroy');
        return Backbone.Marionette.View.prototype.remove.call(this);
    }
});

module.exports = UserTypeaheadView;
