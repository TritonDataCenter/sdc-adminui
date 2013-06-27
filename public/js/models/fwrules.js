var Collection = require('./collection');
var Model = require('./model');

var FWRule = Model.extend({
    idAttribute: 'uuid'
});

var FWRules = Collection.extend({
    url: function() {
        return '/_/fw/rules';
    }
});

module.exports = FWRules;
