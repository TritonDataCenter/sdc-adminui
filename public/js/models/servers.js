define(function(require) {
	var Server = require('models/server');
	var Servers = Backbone.Collection.extend({
		url: "/_/servers",
		model: Server
	});
	return Servers;
});