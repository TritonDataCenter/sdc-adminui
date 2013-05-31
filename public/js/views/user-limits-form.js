var Backbone = require('backbone');
var _ = require('underscore');

var Limit = require('../models/limit');

var UserLimitsForm = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/user-limits-form.hbs'),
    events: {
        'blur input': 'onChangeInput',
        'click .cancel': 'onCancel',
        'submit form': 'onClickSave'
    },

    modelEvents: {
        'sync': 'onSync'
    },
    initialize: function(options) {
        if (! this.model) {
            this.model = new Limit({}, {user: options.user});
            this.delegateEvents();
        }
    },
    focus: function() {
        this.$('input:first').focus();
    },
    onCancel: function() {
        this.trigger('cancel');
        this.close();
    },
    onSync: function() {
        this.trigger('limit:saved', this.model);
        this.close();
    },
    onClickSave: function() {
        if (this.model.isNew()) {
            this.model.save(this.serializeForm());
        } else {
            this.model.save(this.serializeForm(), { patch: true });
        }

        return false;
    },
    serializeForm: function() {
        var obj = {};
        var datacenter = this.model.get('datacenter') || this.$('input[name=datacenter]').val();

        this.$('.limits-input').each(function(e) {
            var i = $(this).find('input[name=image]').val();
            var v = $(this).find('input[name=value]').val();
            if (i && v) {
                obj[i] = v;
            }
        });

        obj.datacenter = datacenter;
        return obj;
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
    },

    serializeData: function() {
        var attrs = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        var data = {
            datacenter: attrs.datacenter,
            limits: []
        };

        _.each(attrs, function(v, k) {
            if (k === 'datacenter') {
                return;
            }
            data.limits.push({image: k, value: v});
        });

        return data;
    }
});

module.exports = UserLimitsForm;
