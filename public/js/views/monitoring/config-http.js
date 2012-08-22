define(['views/base'], function(BaseView) {
    var ConfigHttpProbe = BaseView.extend({

        template: 'monitoring-http-probe',

        events: {
            'click button.btn-primary': 'onComplete',
            'submit form': 'onComplete',

            'keyup input[name=name]': 'validateName',
            'keyup input[name=url]': 'validateUrl',
            'keyup input[name=username]': 'validateUsername',
            'keyup input[name=password]': 'validatePassword',
            'keyup input[name=interval]': 'validateInterval',
            'keyup input[name=max-response-tine]': 'validateMaxResponseTime'
        },

        initialize: function(options) {
            this.params = {type: 'http', config: {}};

            // XXX There should probably be a way to select which agent to run this probe...
            this.params.agent  = options.vm.get('uuid');
        },

        focus: function() {
            this.$('input')[0].focus();
        },

        bindElements: function() {
            this.$url = this.$('input[name=url]');
            this.$urlGroup = this.$('.control-group.url');
            this.$protocol = this.$('select[name=protocol]');

            this.$name = this.$('input[name=name]');
            this.$nameGroup = this.$('.control-group.name');

            this.$username = this.$('input[name=username]');
            this.$usernameGroup = this.$('.control-group.username');

            this.$password = this.$('input[name=password]');
            this.$passwordGroup = this.$('.control-group.password');

            this.$interval = this.$('input[name=interval]');
            this.$intervalGroup = this.$('.control-group.interval');

            this.$maxResponseTime = this.$('input[name=max-response-time]');
            this.$maxResponseTimeGroup = this.$('.control-group.max-response-time');
        },

        render: function() {
            this.setElement(this.template());
            this.bindElements();

            return this;
        },


        /**
         * Input Callbacks
         */
        onComplete: function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (this.validateUrl() &&
                this.validateName() &&
                this.validateUsername() &&
                this.validatePassword() &&
                this.validateInterval() &&
                this.validateMaxResponseTime()) {

                this.populateParams();
                this.trigger('done', this.params);
            }
        },

        populateParams: function() {
            this.params.config.url = _.str.sprintf("%s://%s", this.$protocol.val(), this.$url.val());

            if (this.$name.val().length) {
                this.params.name = this.$name.val();
            }
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
        },

        validateUrl: function() {
            if (this.$url.val().length === 0) {
                this.$urlGroup.addClass('error');
            } else {
                this.$urlGroup.removeClass('error');
                return true;
            }
        },

        validateName: function() {
            if (this.$name.val().length === 0) {
                this.$nameGroup.addClass('error');
            } else {
                this.$nameGroup.removeClass('error');
                return true;
            }
        },

        validateUsername: function() { return true; },

        validatePassword: function() { return true; },

        validateMaxResponseTime: function() {
            var val = this.$maxResponseTime.val();
            if (val.length > 0 && /^\d+$/.test(val) === false) {
                this.$maxResponseTimeGroup.addClass('error');
            } else {
                this.$maxResponseTimeGroup.removeClass('error');
                return true;
            }

        },

        validateInterval: function() {
            var val = this.$interval.val();
            if (val.length > 0 && /^\d+$/.test(val) === false) {
                this.$intervalGroup.addClass('error');
            } else {
                this.$intervalGroup.removeClass('error');
                return true;
            }
        }
    });

    return ConfigHttpProbe;
});
