define(['views/base'], function(BaseView) {

    return BaseView.extend({

        template: 'monitoring-log-scan-probe',

        events: {
            'keyup input[name=name]': 'nameChanged',
            'keyup input[name=path]': 'pathChanged',

            'keyup input[name=regex]': 'regexChanged',
            'change input[name=is-regex]': 'isRegexChanged',

            'keyup input[name=threshold]': 'thresholdChanged',
            'keyup input[name=period]': 'periodChanged',
            'click button': 'done'
        },

        initialize: function(options) {
            _.bindAll(this);

            this.defaults = {
                period: 60,
                threshold: 1,
                path: '',
                regex: ''
            };
            
            this.config = {};
        },

        bindElements: function() {
            this.$name = this.$('input[name=name]');
            this.$threshold = this.$('input[name=threshold]');
            this.$regex = this.$('input[name=regex]');
            this.$path = this.$('input[name=path]');
        },

        focus: function() {
            this.$el.find('input:first').focus();
            this.bindElements();

            return this;
        },

        render: function() {
            this.setElement(this.template());

            return this;
        },

        done: function() {
            this.trigger('done', _.defaults(this.config, this.defaults));
        },

        hide: function() {
            this.$el.modal('hide');
        },

        showError: function(field, msg) {
            this.$('.control-group-'+field).addClass('error');
        },

        hideError: function(field) {
            this.$('.control-group-'+field).removeClass('error');
        },

        nameChanged: function() {
            var vRes = this._validateName();
            if (true === vRes) {
                this.hideError('name');
                this.config.name = this.$name.val();
            } else {
                this.showError('name', vRes);
            }
        },

        pathChanged: function() {
            if (true === this._validatePath()) {
                this.hideError('path');
                this.config.path = this.$path.val();
            } else {
                this.showError('path', 'Path likely to be invalid.');
            }
        },

        thresholdChanged: function() {
            var regex = /^\d+$/;
            var value = this.$threshold.val();
            if (value.length === 0) {
                delete this.config.threshold;
                this.hideError();
                return;
            }

            if (regex.test(value)) {
                this.config.threshold = Number(value);
                this.hideError('threshold');
            } else {
                this.showError('threshold', 'Threshold should be a number');
            }
        },

        periodChanged: function() {
            var res = this._validatePeriod();

            if (res === true) {
                this.config.period = this.$period.val();
                this.hideError('period');
            } else {
                this.showError('period', res);
            }
        },

        isRegexChanged: function() {
            this.config.isRegex = true;
        },

        regexChanged: function() {
            var res = this._validateThreshold();

            if (res === true) {
                this.config.regex = this.$regex.val();

                if (this.config.isRegex) {
                    this.config.regex = regexEscape(this.config.regex);
                }

                this.hideError('regex');
            } else {
                delete this.config.regex;
                this.showError('regex', res);
            }
        },

        _validatePath: function() {
            var regex = /^\/.+/;
            if (regex.test(this.$path.val())) {
                return true;
            } else {
                return 'path liekly to be invalid.';
            }
        },

        _validatePeriod: function() {
            if (this.$period.val().length) {
                if (/^\d+$/.test(this.$period.val())) {
                    return "Period should be a number";
                }
            }
            return true;
        },

        _validateName: function() {
            if (this.$name.val().length === 0) {
                return 'probe name is required';
            }

            var regex = /^[a-zA-Z0-9][a-zA-Z0-9\-\_\.]/;

            if (false === regex.test(this.$name.val())) {
                return "Probe names must begin with an alpha charactor and only include alphanumeric, '_', '.', and '-'";
            }

            return true;
        }
    });
});
