var Model = require('./model');

var FWRule = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/_/fw/rules'
});

module.exports = FWRule;

