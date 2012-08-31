define(function(require) {
	var ProbeGroup = require('models/probe-group');

	var ProbeGroups = Backbone.Collection.extend({
		model: ProbeGroup,
		url: function() {
			return _.str.sprintf("/_/amon/probegroups/%s", this.user );
		}
	});

	return ProbeGroups;
});