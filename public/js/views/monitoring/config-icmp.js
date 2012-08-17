var BaseView = require('views/base');

var HOST_REGEX = /^(?=.{1,255}$)[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?(?:\.[0-9A-Za-z](?:(?:[0-9A-Za-z]|\b-){0,61}[0-9A-Za-z])?)*\.?$/;




var ICMPProbe = BaseView.extend({

	template: 'monitoring-icmp-probe',

	events: {
		"click button.btn-primary": 'onComplete',
		'submit form': 'onComplete',
		"keyup input[name=host]": 'onHostChange',
		"keyup input[name=name]": 'onNameChange'
	},

	initialize: function(options) {
		_.bindAll(this);

		this.defaults = {};
		this.params = {
			type: 'icmp',
			agent: options.vm.get('uuid'),
			config: {}
		};
	},


	bindElements: function() {
		this.$host = this.$('input[name=host]');
		this.$hostControlGroup = this.$('.control-group.host');

		this.$name = this.$('input[name=name]');
		this.$nameControlGroup = this.$('.control-group.name');
	},

	focus: function() {
		this.$('input:first').focus();
	},

	render: function() {
		this.setElement(this.template());
		this.bindElements();

		return this;
	},

	// --- Dom Event Handlers

	onNameChange: function() {
		this.validateName();
	},

	onHostChange: function() {
		this.validateHost();
	},

	onComplete: function(e) {
		e.preventDefault();

		if (this.validateName() && this.validateHost()) {
			this.trigger('done', _.defaults(this.params, this.defaults));
		}
	},

	validateName: function() {
		var val = this.$name.val();
		if (val.length === 0) {
			this.$nameControlGroup.addClass('error');
			return false;
		} else {
			this.$nameControlGroup.removeClass('error');
			this.params.name = val;
			return true;
		}
	},

	validateHost: function() {
		var val = this.$host.val();
		if (val.length === 0 || false === HOST_REGEX.test(val)) {
			this.$hostControlGroup.addClass('error');
			return false;
		} else {
			this.$hostControlGroup.removeClass('error');
			this.params.config.host = val;
			return true;
		}
	}


});


module.exports = ICMPProbe;