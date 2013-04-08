define(function(require) {

    var View = Backbone.Marionette.ItemView.extend({
        template: require('tpl!traits-editor'),
        attributes: {
            'class':'modal',
            'id': 'traits-editor'
        },
        events: {
            'blur textarea': 'checkSyntax',
            'click .btn-primary': 'onClickSave'
        },
        initialize: function(options) {
            options = options || {};
            this.traits = options.traits || {};
        },
        onRender: function() {
            this.$('textarea').text(JSON.stringify(this.traits, null, 2));
        },
        checkSyntax: function() {
            try {
                var traits = JSON.parse(this.$('textarea').val());
                this.$('.btn-primary').removeAttr('disabled');
                this.$('.error').empty();
                return traits;
            } catch (e) {
                this.$('.btn-primary').attr('disabled', 'disabled');
                this.showError('JSON Error: ' + e.message);
            }
        },
        onClickSave: function() {
            var trait = null;
            try {
                traits = JSON.parse(this.$('textarea').val());
            } catch (e) {
                this.showError('JSON Error: ' + e.message);
            } finally {
                if (traits !== null) {
                    this.trigger('save-traits', traits);
                }
            }
        },

        showError: function(message) {
            this.$('.error').text(message);
        },

        close: function() {
            this.$el.modal('hide');
            this.remove();
        },
        show: function() {
            this.render();
            this.$el.modal();
        }
    });

    return View;
});