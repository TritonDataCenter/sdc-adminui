/**
 * views/dashboard.js
 *
 * Dashboard View
*/

define(function(require) {
	var adminui = require('adminui');

	var BaseView = require('views/base');
	var AlarmsView = require('views/alarms');
	var DashboardTemplate = require('text!tpl/dashboard.html');
	var Dashboard = Backbone.Marionette.ItemView.extend({
        id: 'page-dashboard',
		name: 'dashboard',
		url: 'dashboard',
		template: DashboardTemplate,

		initialize: function() {
			this.alarmsView = new AlarmsView({ userUuid: '00000000-0000-0000-0000-000000000000' });
		},

		onRender: function() {
			this.alarmsView.setElement(this.$('#dashboard-alarms')).render();
            var self = this;
            $.getJSON("/_/stats/vm_count", function(res) {
                self.$('.vm-count').html(res.total);
            });

			return this;
		}
	});
	return Dashboard;
});