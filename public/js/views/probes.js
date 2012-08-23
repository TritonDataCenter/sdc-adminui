define(function(require) {

	var Probes = require('models/probes');
	var BaseView = require('views/base');

	var probesTpl = require('text!tpl/probes.html');

	var ProbeItemView = BaseView.extend({
		template: require('text!tpl/probe-item.html'),
		initialize: function(options) {
			this.probe = options.probe;
			console.log(options.probe);
		},
		render: function() {
			this.setElement(this.template({probe: this.probe}));
			return this;
		}
	});

	var ProbesView = BaseView.extend({

		template: probesTpl,

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