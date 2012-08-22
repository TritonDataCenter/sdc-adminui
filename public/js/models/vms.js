define(['backbone', 'models/vm'], function(Backbone, Vm) {
	return Backbone.Collection.extend({
		model: Vm,
		url: "/_/vms"
	});
});
