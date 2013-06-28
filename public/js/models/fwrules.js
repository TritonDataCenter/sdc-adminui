var Collection = require('./collection');
var FWRules = Collection.extend({
    url: function() {
        return '/_/fw/rules';
    }
});

module.exports = FWRules;
