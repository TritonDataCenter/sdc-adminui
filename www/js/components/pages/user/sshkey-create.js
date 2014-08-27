/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('adminui');
var SSHKey = require('../../../models/sshkey');

module.exports = Backbone.Marionette.ItemView.extend({
    id: 'sshkey-create',
    className: 'modal',
    template: require('./sshkey-create.hbs'),
    events: {
        'click button.save': 'onClickSave',
        'submit form': 'onClickSave'
    },
    modelEvents: {
        'sync': 'onModelSync',
        'error': 'onModelError'
    },

    initialize: function(options) {
        if (typeof(options.user) !== 'string') {
            throw new TypeError('options.user {string} required');
        }

        this.model = new SSHKey({ account: options.account, user: options.user });
    },

    onModelSync: function(model) {
        this.trigger('saved', model);
        adminui.vent.trigger('notification', {
            level: 'success',
            message: 'SSH Key has been added to account.'
        });
        this.$el.modal('hide');
        this.remove();
    },

    onModelError: function(model, xhr, error) {
        this.$(".alert .alert-body").html(xhr.responseData.message);
        this.$(".alert").show();
    },

    onClickSave: function(e) {
        e.preventDefault();
        var name = this.$('input[name=name]').val();
        var key = this.$('textarea[name=key]').val();

        name = _.str.trim(name);
        key = _.str.trim(key).replace(/(\r\n|\n|\r)/gm, "");

        this.model.save({ name: name, key: key });
    },

    onRender: function() {
        this.$el.modal();
        this.$('.alert').hide();
        this.$('input:first').focus();
    }
});
