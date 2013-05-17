var Backbone = require('backbone');
var Server = require('./server');

var Servers = Backbone.Collection.extend({
    url: "/_/servers",
    model: Server
});

module.exports = Servers;
