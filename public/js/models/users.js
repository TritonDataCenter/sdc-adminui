define(['backbone','models/user'], function() {
	var Users = Backbone.Collection.extend({
		model: User,
		url: '/_/users',

		searchByLogin: function(login) {
			this.fetch({data: $.param({'login':login}) });
		}
	});

	return Users;
});