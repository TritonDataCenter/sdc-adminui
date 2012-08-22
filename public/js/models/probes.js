define([
	'backbone',
	'models/probe'
	], function(Backbone, Probe) {
	return Backbone.Collection.extend({
		url: '/_/amon/probes',
		model: Probe
	});
});