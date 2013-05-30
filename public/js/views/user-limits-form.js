var Backbone = require('backbone');
var _ = require('underscore');

var UserLimitsForm = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/user-limits-form.hbs'),
    events: {
        'blur input': 'onChangeInput',
        'click .cancel': 'onCancel'
    },
    onCancel: function() {
        this.trigger('cancel');
        this.close().remove();
    },
    onChangeInput: function(e) {
        var container = $(e.target).parents('.limits-input');
        if (this.$('.limits-input:last-child')[0] === container[0] &&
            $('input[name=image]', container).val().length &&
            $('input[name=value]', container).val().length) {
            this.addLimitInput();
        }
    },
    addLimitInput: function() {
        var el = this.$('.limits-input:last-child').clone();
        $('input', el).val('');
        el.appendTo(this.$('.limits-inputs'));
    }
});

module.exports = UserLimitsForm;
