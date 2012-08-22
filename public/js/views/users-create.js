define(function(require) {

    var User = require('models/user');
    
    return Backbone.View.extend({

        template: Handlebars.compile($("#template-users-create").html()),

        events: {
            'submit form': 'create'
        },

        initialize: function() {
            _.bindAll(this, 'showErrors');
            this.model = new User();
            this.model.on('error', this.showErrors, this);
        },

        showErrors: function(field, errors) {
            var ul = $("<ul />");
            _(errors).each(function(e) {
                ul.append('<li>'+e+'</li>');
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
                    model.trigger('error', 'errors', response.error);
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

        render: function() {
            this.$el = $(this.template()).modal({keyboard: false});

            this.$el.on('shown', _.bind(function() {
                this.delegateEvents();
                this.$("input:first").focus();
            }, this));

            return this;
        }

    });
});