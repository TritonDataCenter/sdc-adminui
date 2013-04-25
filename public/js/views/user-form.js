var Backbone = require('backbone');
var _ = require('underscore');



var User = require('../models/user');
var Template = require('../tpl/user-form.hbs');
var app = require('../adminui');

module.exports = Backbone.Marionette.ItemView.extend({

    template: Template,

    id: 'user-form',

    attributes: {
        'class': 'modal'
    },
    modelEvents: {
        'error': 'onError'
    },
    events: {
        'input input[name=first_name]': 'updateCommonName',
        'input input[name=last_name]': 'updateCommonName',
        'submit': 'save'
    },
    bindings: {
        '.action': {
            observe: 'uuid',
            onGet: function(val) {
                if (val && val.length) {
                    return 'Modify';
                } else {
                    return 'Create';
                }
            }
        },
        '[name=login]': 'login',
        '[name=email]': 'email',
        '[name=company]': 'company',
        '[name=phone]': 'phone',
        '[name=password]': 'password',
        '[name=last_name]': 'sn',
        '[name=first_name]': 'givenname',
        '[name=groups]': 'groups'
    },

    updateCommonName: function(e) {
        var newcn = this.$('[name=first_name]').val() + ' ' + this.$('[name=last_name]').val();
        this.model.set({cn:newcn}, {silent: true});
    },


    initialize: function(options) {
        if (options && options.user) {
            this.model = options.user;
            this.mode = 'edit';
        } else {
            this.model = new User();
            this.mode = 'create';
        }
        console.log(this.model);
    },

    onError: function(model, xhr) {
        var ul = $("<ul />");
        this.$('.control-group').removeClass('error');
        _(xhr.responseData.errors).each(function(e) {
            this.$('[name='+e.field+']').parents('.control-group').addClass('error');
            ul.append('<li>'+e.message+' (' + e.field + ')</li>');
        });

        this.$(".alert")
            .empty()
            .append('<h4 class="alert-heading">Please fix the following errors</h4>')
            .append(ul)
            .show();
    },

    save: function(e) {
        e.preventDefault();
        e.stopPropagation();

        var self = this;

        this.$('.alert').hide();
        this.model.save(null, {
            patch: true,
            success: function(model, resp) {
                self.$el.modal('hide').remove();
                app.vent.trigger('showview', 'user', {user: self.model});
                app.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('Created user with login %s', self.model.get('login'))
                });
            }
        });
    },

    serialize: function() {
        var obj = {};

        _(this.$('form').serializeArray()).each(function(o) {
            obj[o.name] = o.value;
        });

        return obj;
    },

    onRender: function() {
        this.stickit();
        this.$el.modal({keyboard: false});
        this.$el.on('shown', _.bind(function() {
            this.$("input:first").focus();
        }, this));

        return this;
    }

});
