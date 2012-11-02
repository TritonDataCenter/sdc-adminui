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
		name: 'dashboard',
		url: 'dashboard',
		template: DashboardTemplate,

		initialize: function() {
			console.log(adminui.user);
			this.alarmsView = new AlarmsView({ userUuid: '00000000-0000-0000-0000-000000000000' });
		},

		onRender: function() {
			this.alarmsView.setElement(this.$('#dashboard-alarms')).render();

			return this;
		}
	});
	return Dashboard;
});