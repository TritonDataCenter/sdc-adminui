var Model = require('./model');

var LinkAggr = Model.extend({
    urlRoot: '/_/linkaggrs',
    idAttribute: 'id'
});
module.exports = LinkAggr;
