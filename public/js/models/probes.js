define([
	'backbone',
	'models/probe'
	],

function(Backbone, Probe) {
	return Backbone.Collection.extend({

		url: '/_/amon/probes',

		model: Probe,

		fetchProbes: function(userUuid) {
			var params = $.param({ user: userUuid });
			this.fetch({ data: params });
		}
	});
});