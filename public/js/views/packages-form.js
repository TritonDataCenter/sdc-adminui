var Backbone = require('backbone');
var _ = require('underscore');

require('backbone.modelbinder');

var adminui = require('../adminui');
var FormTemplate = require('../tpl/packages-form.hbs');
var Package = require('../models/package');
var UserInput = require('../views/typeahead-user');

var PackageForm = Backbone.Marionette.ItemView.extend({
    template: FormTemplate,
    modelEvents: {
        'error': 'onError'
    },
    events: {
        'submit': 'onSubmit',
        'click button[type=cancel]': 'onCancel'
    },
    initialize: function(options) {
        options = options || {};
        this.modelBinder = new Backbone.ModelBinder();

        if (!options.model) {
            this.model = new Package({
                version: "1.0.0"
            });
        }
    },

    onError: function(model, xhr) {
        var ul = $("<ul />");
        this.$('.control-group').removeClass('error');
        _(xhr.responseData.message.split("\n")).each(function(e) {
            ul.append('<li>'+e+'</li>');
        });

        this.$(".alert")
            .empty()
            .append('<h4 class="alert-heading">Please fix the following errors</h4>')
            .append(ul)
            .show();

        $('body').animate({
            scrollTop: this.$('.alert').offset().top
        }, 200);
    },

    onCancel: function(e) {
        e.preventDefault();

        if (this.model.isNew()) {
            this.vent.trigger('showpackage');
        } else {
            this.vent.trigger('showpackage', this.model);
        }
    },

    onSubmit: function(e) {
        e.preventDefault();
        var self = this;
        this.model.set({owner_uuid: this.$('#package-owner').val()});
        this.model.save(null, {
            patch: true,
            success: function(model, resp) {
                self.vent.trigger('showpackage', model);
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: "Package saved succesfully."
                });
            }
        });
    },

    onRender: function() {
        this.modelBinder.bind(this.model, this.el);
        this.userInput = new UserInput({el: this.$('#package-owner')});
        this.userInput.render();
    },

    onClose: function() {
        this.modelBinder.unbind();
    },

    onShow: function() {
        this.$('input:first').focus();
    }
});

module.exports = PackageForm;
