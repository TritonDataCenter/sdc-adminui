define(function(require) {
    var template = '<input class="input input" type="text"><button class="btn btn-primary save">Save</button><button class="btn cancel">Cancel</button>';
    var ChangeRackFormTemplate = Handlebars.compile(template);
    var ChangeRackForm = Backbone.Marionette.ItemView.extend({
        attributes: {
            'class': 'change-rack-form'
        },
        template: ChangeRackFormTemplate,
        events: {
            'click button.save': 'save',
            'click button.cancel': 'cancel'
        },
        save: function() {
            var self = this;
            var rid = this.$('input').val();
            this.model.set({rack_identifier: rid });
            this.model.save(null, {success: function() {
                self.trigger('save', rid);
            }});
        },
        cancel: function() {
            this.trigger('cancel');
            this.remove();
        }
    });

    return ChangeRackForm;
});