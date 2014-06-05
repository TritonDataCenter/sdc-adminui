var Model = require('./model');

var LinkAggr = Model.extend({
    urlRoot: '/api/linkaggrs',
    idAttribute: 'id'
});
module.exports = LinkAggr;
