var Backbone = require('backbone');
var Job = require('../models/job');
var FWRules = require('../models/fwrules');
var adminui = require('../adminui');

var FWRulesListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/fwrules-list-item.hbs'),
    events: {
        'click .enable-rule': 'onEnableRule',
        'click .disable-rule': 'onDisableRule',
        'click .delete-rule': 'onDeleteRule'
    },
    onEnableRule: function() {
        this.trigger('enable:rule');
    },
    onDisableRule: function() {
        this.trigger('disable:rule');
    },
    onDeleteRule: function() {
        this.trigger('delete:rule');
    },
    serializeData: function() {
        var data = this.model.toJSON();
        var reg = (/(FROM) (.*) (TO) (.*) (ALLOW|BLOCK) (.*)/);
        var m = data.rule.match(reg);
        var vars = {};
        vars.from = m[1];
        vars.fromPredicate = m[2];

        if (vars.fromPredicate === ('vm ' + this.model.collection.params.vm_uuid)) {
            vars.fromPredicate = 'THIS VM';
        }
        vars.enabled = data.enabled;
        vars.to = m[3];
        vars.toPredicate = m[4];
        vars.action = m[5];
        vars.actionPredicate = m[6];

        return vars;
    }
});

var FWRulesList = require('./collection').extend({
    tagName: 'ul',
    attributes: {
        'class': 'unstyled fwrules-list'
    },

    itemView: FWRulesListItem,

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    emptyView: require('./empty').extend({
        loadingMessage: 'Loading Firewall Rules...',
        emptyMessage: 'No Firewall Rules'
    }),

    /**
     * Constructor
     * @param  {Object} options.vm VM object to scope fw rules
     */
    initialize: function(options) {
        if (options.vm) {
            this.collection = new FWRules(null, {params: { vm_uuid: options.vm.get('uuid') }});
        } else {
            this.collection = new FWRules();
        }

        this.on('itemview:disable:rule', function(iv) {
            iv.model.on('sync', this.onModelSync, this);
            iv.model.set({enabled: false});
            iv.model.save();
        }, this);

        this.on('itemview:enable:rule', function(iv) {
            iv.model.on('sync', this.onModelSync, this);
            iv.model.set({enabled: true});
            iv.model.save();
        }, this);

        var self = this;
        this.on('itemview:delete:rule', function(iv) {
            $.delete_(iv.model.url(), function(data) {
                self.onModelSync(iv.model, data);
            });
        }, this);
    },

    onModelSync: function(model, resp) {
        var job = new Job({uuid: resp.job_uuid});
        adminui.vent.trigger('showjob', job);
        var self = this;
        job.on('execution:succeeded', function() {
            setTimeout(function() {
                self.collection.fetch();
            }, 2000);
        }, this);
    },

    onItemViewDisableRule: function() {
        console.log('disable-rule');
    },

    onShow: function() {
        this.collection.fetch();
    }
});

module.exports = FWRulesList;
