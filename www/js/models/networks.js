var Backbone = require('backbone');
var Collection = require('./collection');
var Network = require('./network');

module.exports = Collection.extend({
    model: Network,
    url: "/api/networks"
});
