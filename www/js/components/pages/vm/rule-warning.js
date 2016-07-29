/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var Backbone = require('backbone');

var firewallWarning = Backbone.Marionette.ItemView.extend({
    template: require('./rule-warning.hbs'),
    id: 'rule-warning',
    attributes: {
        'class': 'modal'
    },
    events: {
        'click button[type=submit]': 'onSubmit'
    },

    initialize: function (options) {
        this.action = options.action;
        this.isGlobal = options.isGlobal;
        this.onSubmit = options.onSubmit;
        this.message = options.message;
    },

    serializeData: function () {
        var titleAction = this.action[0].toUpperCase() + this.action.substr(1);
        if (this.isGlobal) {
            titleAction += ' global';
        }
        return {
            'action': this.action,
            'message': this.message,
            'titleAction': titleAction
        };
    },

    onRender: function () {
        this.$el.modal().on('hidden', this.remove.bind(this));
        this.$el.modal('show');
    }
});

module.exports = firewallWarning;
