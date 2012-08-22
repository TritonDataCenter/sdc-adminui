define(['views/base'], function(BaseView) {
	var SelectMonitorView = BaseView.extend({
		template: 'select-monitor',

		render: function() {
			this.$el.html(this.template());
			return this;
		}

	});

	return SelectMonitorView;
});