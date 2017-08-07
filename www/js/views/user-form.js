/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

'use strict';

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');
var adminui = require('../adminui');

var User = require('../models/user');
var Template = require('../tpl/user-form.hbs');
var utils = require('../lib/utils');

module.exports = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'user-form',
    modelEvents: {
        'error': 'onError'
    },
    events: {
        'click button[type=cancel]': 'сancel',
        'submit': 'save'
    },
    bindings: {
        '.action': {
            observe: 'uuid',
            onGet: function (val) {
                if (val && val.length) {
                    return 'Modify';
                } else {
                    return 'Create';
                }
            }
        },
        '[name=login]': 'login',
        '[name=email]': 'email',
        '[name=company]': 'company',
        '[name=phone]': 'phone',
        '[name=tenant]': 'tenant',
        '[name=password]': 'password',
        '[name=sn]': 'sn',
        '[name=givenname]': 'givenname',
        '[name="groups"]': 'groups',
        '[name=approved_for_provisioning]': 'approved_for_provisioning',
        '[name=registered_developer]': 'registered_developer',
        '[name=triton_cns_enabled]': 'triton_cns_enabled'
    },

    initialize: function (options) {
        if (options && options.user) {
            this.model = options.user;
            this.mode = 'edit';

            var userData = this.model.attributes;
            if (userData.alias) {
                this.model.set('login', userData.alias);
            }
        } else {
            this.model = new User();
            if (options && options.account) {
                this.model.set({'account': options.account});
            }
            this.mode = 'create';
        }

        if (options && options.redirect) {
            this.redirect = options.redirect;
        }
    },

    onError: function (model, xhr) {
        var errors = xhr.responseData && Array.isArray(xhr.responseData.errors) && xhr.responseData.errors;
        if (errors) {
            this.showError(errors);
            return;
        }
        var message = xhr.responseData.message || 'An error occurred while add/edit user data';
        this.$('.alert')
            .empty()
            .append('<h4 class="alert-heading">' + message + '</h4>')
            .show();
    },

    showError: function (errors) {
        $('.form-group').removeClass('has-error');
        var ul = $('<ul />');
        _(errors).each(function (e) {
            this.$('[name=' + e.field + ']').parents('.form-group').addClass('has-error');
            ul.append('<li>' + e.message + (e.field ? ' (' + e.field + ')' : '') + '</li>');
        }, this);

        this.$('.alert')
            .empty()
            .append('<h4 class="alert-heading">Please fix the following errors</h4>')
            .append(ul)
            .show();
    },

    сancel: function (e) {
        e.preventDefault();
        if (this.model.isNew() && !this.redirect) {
            adminui.vent.trigger('showview', 'users');
        } else {
            adminui.vent.trigger('showcomponent', 'user', this.redirect || {user: this.model});
        }
    },

    save: function (e) {
        e.preventDefault();
        e.stopPropagation();

        var self = this;
        this.$('.alert').hide();
        var validation = this.model.validation;
        var model = this.model.toJSON();
        validation.disableRequiredValidation = this.mode === 'edit';
        utils.validate(model, validation, function (err) {
            if (err) {
                self.showError(err);
                return;
            }

            self.model.save(null, {
                patch: true,
                success: function (_model, resp) {
                    adminui.vent.trigger('showcomponent', 'user', self.redirect || {user: self.model});
                    adminui.vent.trigger('notification', {
                        level: 'success',
                        message: _.str.sprintf('%s <strong>%s</strong> saved successfully.', self.model.get('account') ? 'Sub-user' : 'User', self.model.get('login'))
                    });
                }
            });
        });
    },

    serialize: function () {
        var obj = {};

        _(this.$('form').serializeArray()).each(function (o) {
            obj[o.name] = o.value;
        });

        return obj;
    },

    onRender: function () {
        this.stickit();
        this.$('input:first').focus();
        this.$('.alert').hide();
        this.$('[data-toggle="tooltip"]').tooltip();
        return this;
    }

});
