define(function(require) {
	return Backbone.Model.extend({
		idAttribute: 'uuid',
		url: function() {
			return '/_/packages/' + this.get('uuid');
		}
	});
});