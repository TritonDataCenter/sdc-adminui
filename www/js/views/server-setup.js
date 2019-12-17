/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2019 Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var app = require('../adminui');

var Template = require('../tpl/server-setup.hbs');
var ViewModel = Backbone.Model.extend({});
var ServerSetupView = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'server-setup',
    attributes: {
        'class': 'modal'
    },
    events: {
        'submit form': 'setup',
        'click .setup': 'setup'
    },
    initialize: function (options) {
        this.viewModel = new ViewModel({customHostname: false});
    },
    setup: function (e) {
        e.preventDefault();
        var server = this.model;
        var self = this;
        var hostname = this.$('input[name=hostname]').val();
        var encryption_enabled = this.$('input[name=encryption_enabled]');
        this.model.setup({
            hostname: hostname,
            encryption_enabled: encryption_enabled.is(':checked')
        }, function (job) {
            self.$el.modal('hide').remove();
            app.vent.trigger('showjob', job);
            self.listenTo(job, 'execution', function (status) {
                if (status === 'succeeded') {
                    server.fetch();
                }
                app.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('Server %s setup complete.',
                        server.get('hostname'))
                });
            });
        });
    },
    onRender: function () {
        this.$el.modal().show();
    }
});
module.exports = ServerSetupView;
