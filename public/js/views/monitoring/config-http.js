var BaseView = require('views/base');
var ConfigHttpProbe = BaseView.extend({

	template: 'monitoring-http-probe',

	events: {
		'click button.btn-primary': 'onComplete',
		'keyup input[name=url]': 'onUrlChange',
		'keyup input[name=username]': 'onUsernameChange',
		'keyup input[name=password]': 'onPasswordChange'
	},

	initialize: function(options) {
		this.config = {type:'http'};
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
		this.config.url = _.str.sprintf("%s%s", this.$protocol.val(), this.$url.val());
	},

	onUsernameChange: function() {
		this.config.username = this.$username.val();
	},

	onPasswordChange: function() {
		this.config.password = this.$password.val();
	},

	onIntervalChange: function() {
		this.config.interval = this.$interval.val();
	}
});

module.exports = ConfigHttpProbe;