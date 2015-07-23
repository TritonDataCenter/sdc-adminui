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

var User = require('../models/user');
var Template = require('../tpl/user-form.hbs');
var utils = require('../lib/utils');

module.exports = Backbone.Marionette.ItemView.extend({

    template: Template,

    id: 'user-form',

    attributes: {
        'class': 'modal'
    },
    modelEvents: {
        'error': 'onError'
    },
    events: {
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
        '[name=registered_developer]': 'registered_developer'
    },

    initialize: function (options) {
        if (options && options.user) {
            this.model = options.user;
            this.mode = 'edit';
        } else {
            this.model = new User();
            if (options && options.account) {
                this.model.set({'account': options.account});
            }
            this.mode = 'create';
        }
    },

    onError: function (model, xhr) {
        this.showError(xhr.responseData.errors);
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

    save: function (e) {
        e.preventDefault();
        e.stopPropagation();

        var self = this;

        this.$('.alert').hide();
        utils.validate(self.model, function (err) {
            if (err) {
                return self.showError(err);
            }
            self.model.save(null, {
                patch: true,
                success: function (model, resp) {
                    self.$el.modal('hide').remove();
                    self.trigger('user:saved', self.model);
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
        this.$el.on('shown.bs.modal', _.bind(function () {
            this.$('input:first').focus();
        }, this));
        this.$el.modal({keyboard: false});
        this.$('.alert').hide();

        return this;
    }

});
