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
var $ = require('jquery');
var _ = require('underscore');

var DashboardTemplate = require('../tpl/dashboard.hbs');
var Dashboard = Backbone.Marionette.ItemView.extend({
    id: 'page-dashboard',
    name: 'dashboard',
    url: 'dashboard',
    template: DashboardTemplate,

    initialize: function() {
        this._requests = [];
    },

    _bytesToGb: function(val) {
        return val / 1024 / 1024 / 1024;
    },

    onRender: function() {
        var self = this;
        this._requests.push(
            $.getJSON("/api/stats/all", function(res) {
                self.$('.vm-count').text(res.vmCount.total);
                self.$('.server-total-memory').text(_.str.sprintf('%.2f GB',
                    self._bytesToGb(res.serverMemory.total)
                ));

                var provisionable = self._bytesToGb(res.serverMemory.provisionable);
                self.$('.server-provisionable-memory').text(_.str.sprintf('%.2f', provisionable));

                var percent = ((res.serverMemory.total - res.serverMemory.provisionable) / res.serverMemory.total) * 100;
                if (isNaN(percent)) {
                    percent = 100;
                }
                self.$('.server-utilization-percent').text( _.str.sprintf('%.2f%%', percent) );
                self.$('.server-count').text(res.serverCount.total);
                self.$('.server-reserved').text(res.serverCount.reserved);
                self.$('.server-unreserved').text(res.serverCount.unreserved);
            }
        ));

        this._requests.push($.getJSON("/api/users?per_page=1", function(res, status, xhr) {
            self.$('.user-count').html(xhr.getResponseHeader('x-object-count'));
        }));
    },
    onClose: function() {
        this._requests.map(function(r) {
            r.abort();
        });
    }
});

module.exports = Dashboard;
