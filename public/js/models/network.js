var Backbone = require('backbone');
var Model = require('./model');

module.exports = Model.extend({
    urlRoot: "/_/networks",
    idAttribute: 'uuid'
});