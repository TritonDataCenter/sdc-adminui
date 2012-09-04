define(function(require) {
	var Alarms = require('models/alarms');
	var Probes = require('models/probes');
	var ProbeGroups = require('models/probe-groups');

	var BaseView = require('views/base');

	var AlarmsView = BaseView.extend({
		template: require('text!tpl/alarms.html'),

		events: {
			'click .summary': 'showDetails'
		},

		showDetails: function(e) {
			$(e.currentTarget).siblings('.details').toggle('slide');
		},

		initialize: function(options) {
			_.bindAll(this);

			if (options.userUuid) {
				this.alarms = new Alarms();
				this.alarms.fetchAlarms(options.userUuid);

				this.probeGroups = new ProbeGroups();
				this.probeGroups.user = options.userUuid;
				this.probeGroups.fetch();

				this.probes = new Probes();
				this.probes.fetchProbes(options.userUuid);
			}

			this.alarms.on('reset', this.render);
			this.probeGroups.on('reset', this.render);
			this.probes.on('reset', this.render);
		},

		dataReady: function() {
			return this.probes.length && this.alarms.length && this.probeGroups.length;
		},

		render: function() {
			if (! this.dataReady()) {
				return;
			}

			this.alarms.each(function(a) {
				if (a.get('probeGroup')) {
					a.probeGroup = this.probeGroups.find(function(pg) {
						return pg.get('uuid') == a.get('probeGroup');
					});
				}

				_(a.get('faults')).each(function(f) {
					var faultProbe = f.probe;
					if (faultProbe) {
						f.probe = this.probes.find(function(p) {
							return p.get('uuid') == faultProbe;
						});
					}
				}, this);
			}, this);

			console.log(this.alarms);

			this.$el.html(this.template({
				probes: this.probes,
				probeGroups: this.probeGroups,
				alarms: this.alarms
			}));

			this.$('.details').hide();
		}
	});

	return AlarmsView;
});