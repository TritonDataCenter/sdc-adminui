define(function(require) {
    var Model = require('model');
	return Model.extend({
        urlRoot: '/_/packages',
        idAttribute: 'uuid',
        defaults: {
            'default': false,
            'traits': {}
        }
    });
});