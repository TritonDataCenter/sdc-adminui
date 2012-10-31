define(function(require) {
	return Backbone.Model.extend({
        urlRoot: '/_/packages',
        idAttribute: 'uuid',
        defaults: {
            'default': false
        }
    });
});