var Backbone = require('backbone');
var _ = require('underscore');

require('backbone.modelbinder');
var FormTemplate = require('../tpl/packages-form.hbs');
var Package = require('../models/package');

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
            console.log(this.model.isNew());
            this.vent.trigger('showpackage');
        } else {
            this.vent.trigger('showpackage', this.model);
        }
    },

    onSubmit: function(e) {
        e.preventDefault();
        var self = this;
        this.model.save(null, {
            success: function(model, resp) {
                console.log(model);
                self.vent.trigger('showpackage', model);
            }
        });
    },

    onRender: function() {
        this.modelBinder.bind(this.model, this.el);
    },

    onClose: function() {
        this.modelBinder.unbind();
    },

    onShow: function() {
        this.$('input:first').focus();
    }
});

module.exports = PackageForm;
