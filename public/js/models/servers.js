var Server = require('./server');
var Collection = require('./collection');

var Servers = Collection.extend({
    url: "/_/servers",
    model: Server
});

module.exports = Servers;
