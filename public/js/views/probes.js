define(function(require) {

	var Probes = require('models/probes');
	var Alarms = require('models/alarms');

	var BaseView = require('views/base');

	var probesTpl = require('text!tpl/probes.html');

	var ProbeItemView = BaseView.extend({

		template: require('text!tpl/probe-item.html'),

		events: {
			'click .delete-probe': 'deleteProbe'
		},
		
		initialize: function(options) {
			_.bindAll(this);

			this.probe = options.probe;
			this.probe.on('remove', this.remove);
		},

		render: function() {
			this.setElement(this.template({probe: this.probe}));
			this.$('.delete-probe').tooltip();
			return this;
		},

		deleteProbe: function() {
			this.probe.destroy();
		},

		remove: function() {
			this.$el.addClass('alert');
			this.$el.fadeOut(function() {
				BaseView.prototype.remove.call(this);
			}.bind(this));
		}
	});

	var ProbesView = BaseView.extend({

		template: probesTpl,

		appEvents: {
			'probe:added': 'load'
		},

		initialize: function(options) {
			_.bindAll(this);

			this.probes = new Probes();
			this.probes.on('reset', this.addAll);

			this.alarms = new Alarms();
			this.vm = options.vm;
		},

		load: function() {
			this.alarms.fetchAlarms(this.vm);
			this.probes.fetchProbes(this.vm);
		},

		addAll: function() {
			this.$list.empty();
			if (this.probes.length === 0) {
				this.$blank.show();
			} else {
				this.probes.each(this.addOne);
			}
		},

		addOne: function(probe) {
			var itemView = new ProbeItemView({probe: probe});
			this.$list.append(itemView.render().el);
		},

		render: function() {
			this.$el.html(this.template());
			this.$list = this.$('ul');
			this.$blank = this.$('.blank');
			this.$blank.hide();
			return this;
		}
	});

	return ProbesView;
});