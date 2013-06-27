var Backbone = require('backbone');
var FWRules = require('../models/fwrules');

var FWRulesListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/fwrules-list-item.hbs'),
    serializeData: function() {
        var data = this.model.toJSON();
        console.log(data.rule);
        var reg = (/(FROM) (.*) (TO) (.*) (ALLOW|DENY) (.*)/);
        var m = data.rule.match(reg);
        var vars = {};
        vars.from = m[1];
        vars.fromPredicate = m[2];
        vars.to = m[3];
        vars.toPredicate = m[4];
        vars.action = m[5];
        vars.actionPredicate = m[6];
        console.log(vars);

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
    },
    onShow: function() {
        this.collection.fetch();
    }
});

module.exports = FWRulesList;
