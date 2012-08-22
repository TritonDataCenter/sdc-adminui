/**
 * views/dashboard.js
 *
 * Dashboard View
*/

define(function(require) {
	var BaseView = require('views/base');
	var Dashboard = BaseView.extend({

		name: 'dashboard',

		template: require('text!tpl/dashboard.html'),

		render: function() {
			this.$el.html(this.template());

			return this;
		}
	});
	return Dashboard;
});