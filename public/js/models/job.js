define(function(require) {
	var Backbone = require('backbone');
	var Job = Backbone.Model.extend({
		defaults: {
			"name": ""
		},
		urlRoot: "/_/jobs",
		idAttribute: "uuid",
		startWatching: function() {
			var self = this;
			this._interval = setInterval(function() {
				self.fetch();
			}, 1000);
		},
		stopWatching: function() {
			clearInterval(this._interval);
		}
	});
	return Job;
});