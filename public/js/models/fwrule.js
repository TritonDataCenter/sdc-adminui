var Model = require('./model');

var FWRule = Model.extend({
    idAttribute: 'uuid',
    url: function() {
        if (this.isNew()) {
            return '/api/fw/rules';
        } else {
            return '/api/fw/rules/' + this.get('uuid');
        }
    },
    tokenizeRule: function() {
        var reg = (/(FROM) (.*) (TO) (.*) (ALLOW|BLOCK) (.*)/);
        var rule = this.get('rule');
        var vars = {};
        if (rule && typeof(rule) === 'string') {
            var m = rule.match(reg);
            vars.from = m[1];
            vars.fromPredicate = m[2];
            vars.to = m[3];
            vars.toPredicate = m[4];
            vars.action = m[5];
            vars.actionPredicate = m[6];
        }
        return vars;
    }
});

module.exports = FWRule;

