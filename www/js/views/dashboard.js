/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/**
 * ./dashboard.js
 *
 * Dashboard View
 **/

var Backbone = require('backbone');
var _ = require('underscore');
var $ = require('jquery');

var DashboardTemplate = require('../tpl/dashboard.hbs');
var Dashboard = Backbone.Marionette.ItemView.extend({
    id: 'page-dashboard',
    name: 'dashboard',
    url: 'dashboard',
    template: DashboardTemplate,

    initialize: function() {
    },

    _bytesToGb: function(val) {
        return val / 1024 / 1024 / 1024;
    },

    onRender: function() {

        var self = this;
        $.getJSON("/api/stats/vm_count", function(res) {
            self.$('.vm-count').html(res.total);
        });

        $.getJSON("/api/stats/server_memory", function(res) {
            var total = self._bytesToGb(res.total);
            self.$('.server-total-memory').html(_.str.sprintf('%.2f GB', total));

            var provisionable = self._bytesToGb(res.provisionable);
            self.$('.server-provisionable-memory').html(_.str.sprintf('%.2f', provisionable));

            var percent = ((res.total - res.provisionable) / res.total) * 100;
            if (isNaN(percent)) {
                percent = 100;
            }
            self.$('.server-utilization-percent').html(
                _.str.sprintf('%.2f%%', percent)
            );
        });

        $.getJSON("/api/stats/server_count", function(res) {
            self.$('.server-count').html(res.total);
            self.$('.server-reserved').html(res.reserved);
            self.$('.server-unreserved').html(res.unreserved);
        });

        $.getJSON("/api/users?per_page=1", function(res, status, xhr) {
            self.$('.user-count').html(xhr.getResponseHeader('x-object-count'));
        });

    }
});

module.exports = Dashboard;
