

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
            userUuid: adminui.user.get('adminUuid')
        });
    },

    onRender: function() {
        this.alarmsView.setElement(this.$('#dashboard-alarms')).render();
        var self = this;
        $.getJSON("/_/stats/vm_count", function(res) {
            self.$('.vm-count').html(res.total);
        });
        $.getJSON("/_/stats/server_count", function(res) {
            self.$('.server-count').html(res.total);
        });

        return this;
    }
});

module.exports = Dashboard;