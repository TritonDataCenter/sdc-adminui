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

var User = require('../models/user');

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
        this.selectedUser = null;
        this.initializeEngine();
    },

    onTypeaheadSelect: function(e, datum) {
        console.debug('typeahead selected', e, datum);
        this.$el.tooltip('destroy');
        this.selectedUser = datum.model;
        this.trigger('selected', datum.model);
    },

    clearField: function() {
        process.nextTick(function() {
            this.$el.val('');
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

        if ($field.val().length !== 36) {
            this.$el.tooltip({
                placement: 'top',
                title: 'Invalid user UUID provided.'
            });
            this.clearField();
            if ($field.val().length !== 0) {
                this.$el.focus();
            }
        }
    },

    initializeEngine: function() {
        var self = this;
        this.engine = new Bloodhound({
            limit: 25,
            name: 'users',
            remote: {
                url: '/api/users?q=%QUERY',
                ajax: {
                    beforeSend: function(xhr) {
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
                },
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            datumTokenizer: function(u) {
                return [u.login, u.uuid, u.email];
            }
        });
        this.engine.initialize();
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
        this.$el.typeahead({
            name: 'users',
            minLength: 1,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'users',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: UserTypeaheadTpl
            }
        });
    }
});

module.exports = UserTypeaheadView;
