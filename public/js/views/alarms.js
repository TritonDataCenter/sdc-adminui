define(function(require) {
	var Alarms = require('models/alarms');
	var BaseView = require('views/base');

	var AlarmsView = BaseView.extend({
		template: require('text!tpl/alarms.html'),

		initialize: function(options) {
			_.bindAll(this);

			this.alarms = options.alarms || new Alarms();
			this.vm = options.vm;
			this.alarms.on('reset', this.render);
		},

		render: function() {
			this.$el.html(this.template({alarms: this.alarms.toJSON()}));
		},

		load: function() {
			if (this.vm) {
				this.alarms.fetchAlarms(this.vm);
			} else {
				this.alarms.fetch();
			}
		}
	});

	return AlarmsView;
});