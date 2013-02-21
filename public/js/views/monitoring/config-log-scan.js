define(function(require) {
    var BaseView = require('views/base');
    var tplLogScan = require('tpl!probe-log-scan');

    return Backbone.Marionette.ItemView.extend({

        template: tplLogScan,

        events: {
            'keyup input[name=name]': 'nameChanged',
            'keyup input[name=path]': 'pathChanged',
            'keyup input[name=pattern]': 'patternChanged',

            'change input[name=is-regex]': 'isRegexChanged',

            'keyup input[name=threshold]': 'thresholdChanged',
            'keyup input[name=period]': 'periodChanged',
            'click button': 'done'
        },

        initialize: function(options) {
            _.bindAll(this);

            this.params = {};
            this.params.type = 'log-scan';
            this.params.machine = options.vm.get('uuid');
            this.params.config = {};
            this.params.config.match = {};
        },

        bindElements: function() {
            this.$name = this.$('input[name=name]');
            this.$path = this.$('input[name=path]');
            this.$threshold = this.$('input[name=threshold]');
            this.$isRegex = this.$('input[name=is-regex]');
            this.$pattern = this.$('input[name=pattern]');
            this.$period = this.$('input[name=period]');
            this.$completeButton = this.$('button');
        },

        focus: function() {
            this.$('input:first').focus();

            return this;
        },

        onRender: function() {
            this.bindElements();
            this.initialState();

            return this;
        },

        initialState: function() {
            this.$completeButton.addClass('disabled');
        },



        done: function() {
            this.trigger('done', this.params);
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
                this.params.name = this.$name.val();
            } else {
                this.showError('name', vRes);
            }
        },

        pathChanged: function() {
            if (true === this._validatePath()) {
                this.hideError('path');
                this.params.config.path = this.$path.val();
            } else {
                this.showError('path', 'Path likely to be invalid.');
            }
        },

        patternChanged: function() {
            if (true === this._validatePattern()) {
                this.hideError('pattern');
                console.log(this.$pattern.val());
                this.params.config.match.pattern = this.$pattern.val();
                console.log(this.params);

            } else {
                this.showError('pattern', 'Pattern is required');
            }
        },

        thresholdChanged: function() {
            var regex = /^\d+$/;
            var value = this.$threshold.val();
            if (value.length === 0) {
                delete this.params.config.threshold;
                this.hideError();
                return;
            }

            if (regex.test(value)) {
                this.params.config.threshold = Number(value);
                this.hideError('threshold');
            } else {
                this.showError('threshold', 'Threshold should be a number');
            }
        },

        periodChanged: function() {
            var res = this._validatePeriod();

            if (res === true) {
                this.params.config.period = this.$period.val();
                this.hideError('period');
            } else {
                this.showError('period', res);
            }
        },

        isRegexChanged: function() {
            if (this.$isRegex.is(':checked')) {
                this.params.config.match.type = 'regex';
            } else {
                this.params.config.match.type = 'substring';
            }
        },

        regexChanged: function() {
            var res = this._validateThreshold();

            if (res === true) {
                this.params.config.match.pattern = this.$pattern.val();
                this.hideError('regex');
            } else {
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

        _validatePattern: function() {
            console.log('validate-pattern');
            if (this.$pattern.val().length) {
                return true;
            } else {
                return "Pattern must be provided";
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

        _validateThreshold: function() {
            if (this.$threshold.val().length) {
                if (/^\d+$/.test(this.$threshold.val())) {
                    return "Threshold should be a number";
                }
            }
            return true;
        },

        _validateName: function() {
            if (this.$name.val().length === 0) {
                return 'probe name is required';
            }

            return true;
        }
    });
});
