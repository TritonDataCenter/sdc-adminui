var Server = require('models/server');
var Servers = Backbone.Collection.extend({
  url: "/_/servers",
  model: Server
});


module.exports = Servers;
