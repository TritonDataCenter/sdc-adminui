/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2019 Joyent, Inc.
 */

'use strict';
/* eslint-disable max-len */

var Backbone = require('backbone');
var _ = require('underscore');
var app = require('../../../adminui');

var JobProgressView = require('../../../views/job-progress');
var Template = require('./disks-form.hbs');
var ViewModel = Backbone.Model.extend({});
var DisksFormView = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'disks-form',
    attributes: {
        'class': 'modal'
    },
    events: {
        'submit form': 'doDiskAction',
        'click .add': 'doDiskAction',
        'click .resize': 'doDiskAction'
    },

    initialize: function (options) {
        options = options || {};

        if (options.vm) {
            this.vm = options.vm;
        }
    },

    doDiskAction: function (e) {
        e.preventDefault();
        var size = this.$('input[name=size]').val();
        var pci_slot = this.$('input[name=pci_slot]').val();
        var dangerous_allow_shrink = this.$('input[name=dangerous_allow_shrink]').is(':checked');
        var opts = {
            size: Number(size)
        };
        if (pci_slot) {
            opts.pci_slot = pci_slot;
            if (dangerous_allow_shrink) {
                opts.dangerous_allow_shrink = true;
            }
            this.vm.resizeDisk(opts, this._onJob.bind(this));
        } else {
            this.vm.createDisk(opts, this._onJob.bind(this));
        }
    },

    _onJob: function (err, job) {
        if (err) {
            console.log('[job error]: ', err);
            var msg = (err.responseText) ?
                    JSON.parse(err.responseText).message:
                    'Error creating job';
            app.vent.trigger('notification', {
                level:'error',
                message: msg
            });
            return;
        }
        var self = this;
        this.$el.modal('hide').remove();
        var jobView = new JobProgressView({model: job});
        this.listenTo(jobView, 'execution', function (exec) {
            if (exec === 'succeeded') {
                self.vm.fetch();
            }
        });
        jobView.show();
    },

    onRender: function () {
        this.$el.modal().show();
    }
});
module.exports = DisksFormView;
