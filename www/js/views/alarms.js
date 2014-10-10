/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var Alarms = require('../models/alarms');
var Alarm = require('../models/alarm');

var Probes = require('../models/probes');
var ProbeGroups = require('../models/probe-groups');
var AlarmsTemplate = require('../tpl/alarms.html');

var adminui = require('../adminui');

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
        var alarm = new Alarm({
            id: uuid,
            user: this.probeGroups.user
        });
        alarm.suppress(function() {
            self.fetch();
        });
    },

    initialize: function(options) {
        this.alarms = new Alarms();
        this.probeGroups = new ProbeGroups();
        this.probeGroups.user = options.userUuid;
        this.probes = new Probes();

        this.listenTo(this.alarms, 'sync', this.render);
        this.listenTo(this.probeGroups, 'sync', this.render);
        this.listenTo(this.probes, 'sync', this.render);
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
        if (!this.dataReady()) {
            return;
        }

        this.alarms.each(function(a) {
            if (a.get('probeGroup')) {
                a.probeGroup = this.probeGroups.get(a.get('probeGroup')).toJSON();
            }

            if (a.get('probe')) {
                a.probe = this.probes.get(a.get('probe')).toJSON();
            }

            a.faults = _(a.get('faults')).map(function(f) {
                if (f.probe) {
                    f.probe = this.probes.get(f.probe).toJSON();
                }
                return f;
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
        adminui.vent.trigger('settitle', 'alarms');
        this.$('.details').hide();
    }
});

module.exports = AlarmsView;
