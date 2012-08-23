define([
	'backbone',
	'models/probe'
	],

function(Backbone, Probe) {
	return Backbone.Collection.extend({

		url: '/_/amon/probes',

		model: Probe,

		fetchProbes: function(vm) {
			if (vm.get('owner_uuid') && vm.get('uuid')) {
				var params = $.param({
					user: vm.get('owner_uuid'),
					machine: vm.get('uuid')
				});
				this.fetch({ data: params });
			}
		}
	});
});