define(function(require) {
	var Alarms = require('models/alarms');
	var Probes = require('models/probes');
	var ProbeGroups = require('models/probe-groups');
    var AlarmsTemplateText = require('text!tpl/alarms.html');
    var AlarmsTemplate = _.template(AlarmsTemplateText);


	var AlarmsView = Backbone.Marionette.ItemView.extend({
		template: function(vars) {
            vars.alarms = vars.alarms || [];
            return AlarmsTemplate(vars);
        },

		events: {
			'click .summary': 'showDetails'
		},

		showDetails: function(e) {
			$(e.currentTarget).siblings('.details').toggle();
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

			this.bindTo(this.alarms, 'reset', this.render);
			this.bindTo(this.probeGroups, 'reset', this.render);
			this.bindTo(this.probes, 'reset', this.render);
		},

		dataReady: function() {
			return this.probes.length && this.alarms.length && this.probeGroups.length;
		},

        serializeData: function() {
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

            var vars = {
                probes: this.probes,
                probeGroups: this.probeGroups,
                alarms: this.alarms
            };
            return vars;
        },

		onRender: function() {
			this.$('.details').hide();
		}
	});

	return AlarmsView;
});