define(function(require) {
	var User = require('models/user');
	var Users = Backbone.Collection.extend({
		model: User,
		url: '/_/users',

		searchByLogin: function(login) {
			this.fetch({data: $.param({'login':login}) });
		}
	});

	return Users;
});