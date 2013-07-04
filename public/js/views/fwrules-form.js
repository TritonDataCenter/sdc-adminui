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

    initialize: function(options) {
        if (!options.model) {
            this.model = new FWRule();
        }
        if (options.vm && options.vm.get('owner_uuid')) {
            this.model.set({owner_uuid: options.vm.get('owner_uuid')});
        }
        if (this.model.isNew() && options.vm) {
            this.model.set({rule: 'FROM any TO vm '+options.vm.get('uuid') + ' ALLOW '});
        }
    },

    onRender: function() {
        var data = this.model.toJSON();
        _.extend(data, this.model.tokenizeRule());
        Backbone.Syphon.deserialize(this, data);
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

        this.listenTo(job, 'execution:succeeded', function() {
            this.trigger('rule:saved');
            this.trigger('close');
        });

        adminui.vent.trigger('showjob', job);
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
        this.model.set({
            enabled: data.enabled,
            rule: rule
        });
        this.model.save();
    }
});

module.exports = FWRulesForm;
