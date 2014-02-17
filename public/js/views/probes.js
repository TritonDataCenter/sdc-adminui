var Backbone = require('backbone');
var Probes = require('../models/probes');
var Alarms = require('../models/alarms');
var _ = require('underscore');

var BaseView = require('./base');

var probesTpl = require('../tpl/probes.hbs');

var ProbeItemView = BaseView.extend({

    template: require('../tpl/probe-item.html'),

    events: {
        'click .delete-probe': 'deleteProbe'
    },

    initialize: function(options) {
        this.probe = options.probe;
        this.probe.on('remove', this.remove);
        this.probe.on('alarm', this.renderAlarm);
    },

    render: function() {
        this.setElement(this.template({
            probe: this.probe
        }));
        this.$('.delete-probe').tooltip();
        return this;
    },

    renderAlarm: function(alarm) {
        this.$('.status').removeClass().addClass('status');
        if (alarm.get('closed') === true) {
            this.$('.status').addClass('clsoed');
        } else {
            this.$('.status').addClass('open');
        }
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
        this.alarms.on('reset', this.triggerAlarms);

        this.vm = options.vm;
    },


    load: function() {
        this.probes.fetchProbes(this.vm);
    },

    triggerAlarms: function(alarms) {
        this.probes.each(function(p) {
            alarms.each(function(a) {
                var faults = a.get('faults');
                _(faults).each(function(f) {
                    if (f.probe === p.get('uuid')) {
                        p.trigger('alarm', a);
                    }
                });
            });
        });
    },

    addAll: function() {
        this.alarms.fetchAlarms(this.vm);
        this.$list.empty();
        if (this.probes.length === 0) {
            this.$blank.show();
        } else {
            this.probes.each(this.addOne);
        }
    },

    addOne: function(probe) {
        var itemView = new ProbeItemView({
            probe: probe
        });
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

module.exports = ProbesView;
