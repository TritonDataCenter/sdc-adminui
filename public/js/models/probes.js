var Backbone = require('backbone');
var Probe = require('./probe');

	module.exports = Backbone.Collection.extend({

		url: '/api/amon/probes',

		model: Probe,

		fetchProbes: function(userUuid) {
			var params = $.param({ user: userUuid });
			this.fetch({ data: params });
		}
	});
