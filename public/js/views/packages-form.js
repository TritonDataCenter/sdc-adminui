define(function(require) {
    var FormTemplate = require('text!tpl/packages-form.html');
    var Package = require('models/package');

	var PackageForm = Backbone.Marionette.ItemView.extend({
        template: FormTemplate,
        events: {
            'submit': 'onSubmit',
            'click button[type=cancel]': 'onCancel'
        },
        initialize: function(options) {
            options = options || {};
            this.modelBinder = new Backbone.ModelBinder();

            if (! options.model) {
                this.model = new Package({ version: "1.0.0" });
            }
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

    return PackageForm;
});