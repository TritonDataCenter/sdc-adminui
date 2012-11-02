define(function(require) {
	return Backbone.Model.extend({
		urlRoot: "/_/networks",
		idAttribute: 'uuid'
	});
});