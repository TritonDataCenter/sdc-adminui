var Backbone = require('backbone');
var Model = require('./model');

module.exports = Model.extend({
    urlRoot: "/api/nic_tags",
    idAttribute: 'name'
});
