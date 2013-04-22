var Backbone = require('backbone');
var Network = require('./network');

module.exports = Backbone.Collection.extend({
    model: Network,
    url: "/_/networks"
});
