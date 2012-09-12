define(function(require) {
	var ko = require('knockout');
	var BaseView = require('views/base');
	var MetadataList = BaseView.extend({

		template: require("text!tpl/metadata.html"),

		initialize: function(options) {
			_.bindAll(this);
			if (! options.vm) {
				throw new TypeError('options.vm required');
			}
			this.vm = options.vm;
			this.metadata = ko.observableArray([]);
		},
		render: function() {
			this.$el.html(this.template());
			_.each(this.vm.get('customer_metadata'), function(v, k) {
				this.metadata.push({key:k, value:v});
			}, this);
			ko.applyBindings({metadata: this.metadata});
		}
	});

	return MetadataList;
});