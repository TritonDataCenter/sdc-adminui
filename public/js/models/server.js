define(['backbone'], function() {
	var Server = Backbone.Model.extend({
		urlRoot: '/_/servers',

		idAttribute: 'uuid',

		defaults: {
			sysinfo:{}
		},

		setup: function(callback) {
			$.post(this.url(), {action:'setup'}, callback);
		}

	});
	return Server;
});