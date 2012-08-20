var BaseView = require('views/base');
var ConfigHttpProbe = BaseView.extend({

	template: 'monitoring-http-probe',

	events: {
		'click button.btn-primary': 'onComplete',
		'submit form': 'onComplete',

		'keyup input[name=name]': 'onNameChange',
		'keyup input[name=url]': 'onUrlChange',
		'keyup input[name=username]': 'onUsernameChange',
		'keyup input[name=password]': 'onPasswordChange',
		'keyup input[name=interval]': 'onIntervalChange',
		'keyup input[name=max-response-tine]': 'onMaxResponseTimeChange'
	},

	initialize: function(options) {
		this.params = {type: 'http', config: {}};
	},

	focus: function() {
		this.$('input')[0].focus();
	},

	bindElements: function() {
		this.$url = this.$('input[name=url]');
		this.$urlGroup = this.$('.control-group.url');

		this.$name = this.$('input[name=name]');
		this.$nameGroup = this.$('.control-group.name');

		this.$maxResponseTime = this.$('input[name=max-response-time]');
		this.$maxResponseTimeGroup = this.$('.control-group.max-response-time');

		this.$interval = this.$('input[name=interval]');
		this.$intervalGroup = this.$('.control-group.interval');

		this.$protocol = this.$('input[name=protocol]');
	},

	render: function() {
		this.setElement(this.template());
		this.bindElements();

		return this;
	},


	/**
     * Input Callbacks
     */
     
	onComplete: function() {
		this.params.config.url = _.str.sprintf("%s%s", this.$protocol.val(), this.$url.val());

		if (this.$interval.val().length) {
			this.params.config.interval = Number(this.$interval.val());
		}
		if (this.$username.val().length) {
			this.params.config.username = this.$username.val();
		}
		if (this.$password.val().length) {
			this.params.config.password = this.$password.val();
		}
		if (this.$maxResponseTime.val().length) {
			this.params.config.maxResponseTime = this.$maxResponseTime.val();
		}

		this.trigger('done', this.params);
	},

	onUrlChange: function() {
		if (this.$url.val().length === 0) {
			this.$urlGroup.addClass('error');
		} else {
			this.$urlGroup.removeClass('error');
		}
	},

	onNameChange: function() {
		if (this.$name.val().length === 0) {
			this.$nameGroup.addClass('error');
		} else {
			this.$nameGroup.removeClass('error');
		}
	},

	onUsernameChange: function() {
	},

	onPasswordChange: function() {
	},


	onMaxResponseTimeChange: function() {
		var val = this.$maxResponseTime.val();
		if (val.length > 0 && /^\d+$/.test(val) === false) {
			this.$maxResponseTimeGroup.addClass('error');
		} else {
			this.$maxResponseTimeGroup.removeClass('error');
		}

	},

	onIntervalChange: function() {
		var val = this.$interval.val();
		if (val.length > 0 && /^\d+$/.test(val) === false) {
			this.$intervalGroup.addClass('error');
		} else {
			this.$intervalGroup.removeClass('error');
		}
	}
});

module.exports = ConfigHttpProbe;