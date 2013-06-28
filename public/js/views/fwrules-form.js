var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../adminui');

var sprintf = _.str.sprintf;
var FWRule = require('../models/fwrule');
var Job = require('../models/job');

var FWRulesForm = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'fwrules-form'
    },

    events: {
        'submit form': 'onSubmit',
        'click button[type=submit]': 'onSubmit',
        'click button.cancel': 'onDismiss'
    },

    modelEvents: {
        'sync': 'onSync'
    },

    template: require('../tpl/fwrules-form.hbs'),

    initialize: function() {
        this.model = new FWRule();
    },

    onShow: function() {
        var $el = this.$el;
        $el.hide().slideDown(200, function() {
            $el.find('input:first').focus();
        });
    },

    onDismiss: function() {
        this.trigger('close');
    },

    close: function() {
        var self = this;
        this.$el.slideUp(200, function() {
            Backbone.Marionette.ItemView.prototype.close.call(self);
        });
    },

    onSync: function(model, resp, options) {
        var job = new Job({uuid: resp.job_uuid});
        adminui.vent.trigger('showjob', job);
        var self = this;
        job.on('execution:succeeded', function() {
            self.trigger('rule:created');
            self.trigger('close');
        });
    },

    onSubmit: function(e) {
        e.preventDefault();

        var data = Backbone.Syphon.serialize(this);
        var rule = sprintf(
            'FROM %s TO %s %s %s',
            data.fromPredicate,
            data.toPredicate,
            data.action,
            data.actionPredicate
        );
        this.model.set({rule: rule});
        this.model.save();
    }
});

module.exports = FWRulesForm;
