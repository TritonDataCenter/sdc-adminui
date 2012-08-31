/**
 * views/dashboard.js
 *
 * Dashboard View
*/

define(function(require) {
	var BaseView = require('views/base');
	var AlarmsView = require('views/alarms');

	var Dashboard = BaseView.extend({

		name: 'dashboard',

		template: require('text!tpl/dashboard.html'),

		initialize: function() {
			this.alarmsView = new AlarmsView({ userUuid: '930896af-bf8c-48d4-885c-6573a94b1853' });
		},

		render: function() {
			this.$el.html(this.template());
			this.alarmsView.setElement(this.$('#dashboard-alarms')).render();

			return this;
		}
	});
	return Dashboard;
});