var BaseView = require('views/base');
var ConfigHttpProbe = BaseView.extend({

	template: 'monitoring-http-probe',

	events: {
		'click button.btn-primary': 'onComplete',
		'submit form': 'onComplete',
		'keyup input[name=url]': 'onUrlChange',
		'keyup input[name=username]': 'onUsernameChange',
		'keyup input[name=password]': 'onPasswordChange'
	},

	initialize: function(options) {
		this.params = {type: 'http', config: {}};
		this.defaults = {};
	},

	focus: function() {
		this.$('input')[0].focus();
	},

	bindElements: function() {
		this.$url = this.$('input[name=url]');
		this.$name = this.$('input[name=name]');
		this.$maxResponseTime = this.$('input[name=max-response-time]');
		this.$interval = this.$('input[name=interval]');
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
		var cfg = _.defaults(this.config, this.defaults);
		this.trigger('done', cfg);
	},

	onUrlChange: function() {
		this.params.config.url = _.str.sprintf("%s%s", this.$protocol.val(), this.$url.val());
	},

	onUsernameChange: function() {
		this.params.config.username = this.$username.val();
	},

	onPasswordChange: function() {
		this.params.config.password = this.$password.val();
	},

	onIntervalChange: function() {
		this.params.config.interval = this.$interval.val();
	}
});

module.exports = ConfigHttpProbe;