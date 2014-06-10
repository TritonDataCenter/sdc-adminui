var Server = require('./server');
var Collection = require('./collection');

var Servers = Collection.extend({
    url: "/api/servers",
    model: Server
});

module.exports = Servers;
