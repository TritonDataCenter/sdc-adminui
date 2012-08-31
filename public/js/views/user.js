define(function(require) {
	var BaseView = require('views/base');

	var User = require('models/user');

	var UserView = BaseView.extend({
		template: require('text!tpl/user.html'),

		initialize: function(options) {
			this.user = new User({uuid:options.uuid});
		},

		render: function() {
			this.$el.html(this.template());
		},

		uri: function() {
			return _.str.sprintf('/users/%s', this.user.get('uuid'));
		}
	});

	return UserView;
});