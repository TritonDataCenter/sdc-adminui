define(function(require) {
	var Package = require('models/package');
 	var Packages = Backbone.Collection.extend({
 		model: Package,
 		url: '/_/packages',
 		fetchActive: function() {
 			this.fetch({
 				data: $.param({'active':true})
 			});
 		}
 	});

 	return Packages;
});