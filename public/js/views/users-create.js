define(function(require) {

    var User = require('models/user');
    var Template = require('tpl!users-create');
    
    return Backbone.Marionette.ItemView.extend({

        template: Template,

        id: 'users-create',

        attributes: {
            'class': 'modal fade'
        },

        events: {
            'submit form': 'create'
        },

        modelEvents: {
            'error': 'onError'
        },

        initialize: function() {
            this.model = new User();
        },

        onError: function(errRes) {
            var ul = $("<ul />");
            _(errRes.errors).each(function(e) {
                ul.append('<li>'+e.message+' (' + e.field + ')</li>');
            });

            this.$(".alert")
                .empty()
                .append('<h4 class="alert-heading">Please fix the following errors</h4>')
                .append(ul)
                .show();
        },

        create: function(e) {
            e.preventDefault();
            e.stopPropagation();

            var self = this;

            this.$('.alert').hide();

            this.model.save(this.serialize(), {
                success: function(model, resp) {
                    console.log('hello!');
                    self.$el.modal('hide').remove();
                },
                error: function(model, resp) {
                    var response = JSON.parse(resp.responseText);
                    model.trigger('error', response);
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
            this.$el.modal({keyboard: false});
            this.$el.on('shown', _.bind(function() {
                this.$("input:first").focus();
            }, this));

            return this;
        }

    });
});