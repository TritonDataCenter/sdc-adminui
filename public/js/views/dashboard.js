

/**
 * ./dashboard.js
 *
 * Dashboard View
 **/

var Backbone = require('backbone');

var adminui = require('../adminui');
var AlarmsView = require('./alarms');
var DashboardTemplate = require('../tpl/dashboard.hbs');
var Dashboard = Backbone.Marionette.ItemView.extend({
    id: 'page-dashboard',
    name: 'dashboard',
    url: 'dashboard',
    template: DashboardTemplate,

    initialize: function() {
        this.alarmsView = new AlarmsView({
            userUuid: adminui.user.getAdminUuid()
        });
    },

    onRender: function() {
        this.alarmsView.setElement(this.$('#dashboard-alarms'));
        this.alarmsView.fetch();

        var self = this;
        $.getJSON("/_/stats/vm_count", function(res) {
            self.$('.vm-count').html(res.total);
        });

        $.getJSON("/_/stats/server_count", function(res) {
            self.$('.server-count').html(res.total);
            self.$('.server-reserved').html(res.reserved);
            self.$('.server-unreserved').html(res.unreserved);
        });

        $.getJSON("/_/users?per_page=1", function(res, status, xhr) {
            self.$('.user-count').html(xhr.getResponseHeader('x-object-count'));
        });

        return this;
    }
});

module.exports = Dashboard;
