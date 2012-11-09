define(function(require) {
    var Template = require('text!tpl/networks-create.html');
    var Network = require('models/network');
    var NicTags = require('models/nictags');

    var View = Backbone.Marionette.ItemView.extend({
        template: Template,

        events: {
            'submit form': 'onSubmit'
        },

        initialize: function() {
            this.modelBinder = new Backbone.ModelBinder();
            this.model = new Network();
            this.nicTags = new NicTags();
            this.nicTagsSelect = new Backbone.Marionette.CollectionView({
                itemView: Backbone.View.extend({
                    tagName: 'option',
                    render: function() {
                        var name = this.model.get('name');
                        this.$el.text(name);
                        this.$el.attr("value", name);
                    }
                }),
                collection: this.nicTags
            });
        },

        onSubmit: function(e) {
            e.preventDefault();
            this.model.save();
        },

        onModelError: function(model, res) {
            var err = JSON.parse(res.responseText);
            this.$('.error').html(err.message);
            this.$('.alert').show();
        },

        onRender: function() {
            this.bindTo(this.model, 'error', this.onModelError, this);
            this.nicTagsSelect.setElement(this.$('select[name=nic_tag]'));
            this.nicTags.fetch();
            var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
            bindings['resolvers'].converter = function(direction, value, attrName, model) {
                if (direction == 'ModelToView') {
                    return (value || []).join(',');
                } else {
                    return value.split(',');
                }
            };
            this.modelBinder.bind(this.model, this.el, bindings);
        },

        onShow: function() {
            this.$('.alert').hide();
        },

        onClose: function() {
            this.modelBinder.unbind();
        }
    });

    return View;
});