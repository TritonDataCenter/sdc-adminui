define(function(require) {

	var BaseView = require('views/base');

	var TagsList = BaseView.extend({
		template: require('text!tpl/tags-list.html'),
		initialize: function(options) {
			_.bindAll(this);

			if (! options.vm) {
				throw new TypeError('options.vm required');
			}
			this.vm = options.vm;
		},

		render: function() {
			var tags = this.vm.get('tags');
			this.$el.html(this.template({tags: tags}));
			return this;
		}

	});

	return TagsList;
});