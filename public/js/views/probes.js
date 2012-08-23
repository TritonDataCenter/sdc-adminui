define(function(require) {

	var Probes = require('models/probes');
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
			this.vm = options.vm;
			this.probes.on('reset', this.addAll);
		},

		load: function() {
			this.probes.fetchProbes(this.vm);
		},

		addAll: function() {
			this.$('tbody').empty();
			this.probes.each(this.addOne);
		},

		addOne: function(probe) {
			var itemView = new ProbeItemView({probe: probe});
			this.$('tbody').append(itemView.render().el);
		},

		render: function() {
			this.$el.html(this.template());
			return this;
		}
	});

	return ProbesView;
});