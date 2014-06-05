var Backbone = require('backbone');
var Model = require('./model');

module.exports = Model.extend({
    urlRoot: "/api/networks",
    idAttribute: 'uuid'
});