define(function(require) {
    var Model = require('model');
	return Model.extend({
		urlRoot: "/_/networks",
		idAttribute: 'uuid'
	});
});