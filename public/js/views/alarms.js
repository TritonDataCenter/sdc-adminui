define(function(require) {
	var Alarms = require('models/alarms');
    var Alarm = require('models/alarm');

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
			'click .summary': 'showDetails',
            'click .suppress': 'suppressAlarm'
		},

		showDetails: function(e) {
			$(e.currentTarget).siblings('.details').toggle();
		},

        suppressAlarm: function(e) {
            var self = this;
            e.preventDefault();
            e.stopPropagation();
            var uuid = $(e.target).closest('li').attr('data-uuid');
            uuid = _.str.trim(uuid);
            var alarm = new Alarm({id: uuid, user: this.probeGroups.user });
            alarm.suppress(function() {
                self.fetch();
            });
        },

		initialize: function(options) {
			_.bindAll(this);

			if (options.userUuid) {
				this.alarms = new Alarms();
				this.probeGroups = new ProbeGroups();
				this.probeGroups.user = options.userUuid;
				this.probes = new Probes();
			}

			this.bindTo(this.alarms, 'reset', this.render);
			this.bindTo(this.probeGroups, 'reset', this.render);
			this.bindTo(this.probes, 'reset', this.render);
            this.fetch();
		},

        fetch: function() {
            if (this.options.userUuid) {
                this.probes.fetchProbes(this.options.userUuid);
                this.alarms.fetchAlarms(this.options.userUuid);
                this.probeGroups.fetch();
            }
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
            var open = vars.alarms.filter(function(a) {
                return a.get('suppressed') === false && a.get('closed') === false;
            });
            vars.alarms = new Backbone.Collection(open);
            return vars;
        },

		onRender: function() {
			this.$('.details').hide();
		}
	});

	return AlarmsView;
});