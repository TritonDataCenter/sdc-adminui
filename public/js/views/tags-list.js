var Backbone = require('backbone');

var TemplateEditing = require('../tpl/tags-list-editing.hbs');

var EditingView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: TemplateEditing,
    events: {
        'click .edit': 'edit',
        'click .cancel': 'cancel',
        'click .save': 'save',
        'click .remove': 'del',
        'keyup input': 'checkFields'
    },

    initialize: function(options) {
        _.bindAll(this);

        this.model = new Backbone.Model();

        this.model.on('change:editing', function() {
            if (this.model.get('editing') === true) {
                this.$el.addClass('editing');
            } else {
                this.$el.removeClass('editing');
            }
        }, this);

        if (options.editing) {
            this.model.set({
                editing: options.editing
            });
        }

        this.model.on('change', this.render);

        this.tag = {};
        this.tag.name = options.name || '';
        this.tag.value = options.value || '';
    },

    cancel: function() {
        this.model.set({
            editing: false
        });
        this.trigger('cancel');
    },

    del: function() {
        this.trigger('remove', this.tag);
    },

    edit: function() {
        this.model.set({
            editing: true
        });
    },

    save: function() {
        this.tag.name = this.$('input[name=name]').val();
        this.tag.value = this.$('input[name=value]').val();
        if ((!this.tag.name.length) || (!this.tag.value.length)) {
            return false;
        }
        this.trigger('save', this.tag);
        this.model.set({
            editing: false
        });
    },

    checkFields: function(e) {
        if (this.$('input[name=name]').val().length && this.$('input[name=value]').val().length) {
            this.enableSave();
        } else {
            this.disableSave();
        }
    },

    enableSave: function() {
        this.$('button.save').removeAttr('disabled');
    },

    disableSave: function() {
        this.$('button.save').attr('disabled', 'disabled');
    },

    serializeData: function() {
        return {
            editing: this.model.get('editing'),
            tag: this.tag
        };
    },

    onRender: function() {
        if (this.model.get('editing')) {
            this.checkFields();
            this.focus();
        }
        return this;
    },

    focus: function() {
        this.$('input:first').focus();
    }

});

var TagsList = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/tags-list.hbs'),

    events: {
        'click .add-tag': 'addTag'
    },

    initialize: function(options) {
        _.bindAll(this);

        if (!options.vm) {
            throw new TypeError('options.vm required');
        }
        this.vm = options.vm;
    },

    addTag: function() {
        var addTagButton = this.$('.add-tag');
        addTagButton.hide();

        var addView = new EditingView({
            editing: true
        });
        addView.on('cancel', function() {
            addTagButton.show();
            addView.remove();
        });

        addView.on('save', function(tag) {
            var tags = this.vm.get('tags');
            tags[tag.name] = tag.value;
            this.vm.set({
                tags: tags
            });
            this.vm.saveTags();
            this.render();
        }, this);

        addView.render();

        this.$('tfoot').append(addView.$el);
        addView.focus();
    },

    onRender: function() {
        _(this.vm.get('tags')).each(function(tv, tn) {
            var view = new EditingView({
                name: tn,
                value: tv
            });
            view.on('save', function(tag) {
                var tags = this.vm.get('tags');
                delete tags[tn];
                tags[tag.name] = tag.value;
                this.vm.set({
                    tags: tags
                });
                this.vm.saveTags();
            }, this);

            view.on('remove', function(tag) {
                var tags = this.vm.get('tags');
                delete tags[tag.name];
                this.vm.set({
                    tags: tags
                });
                this.vm.saveTags();
                view.$el.fadeOut(200, function() {
                    view.remove();
                });
            }, this);

            this.$('tbody').append(view.$el);
            view.render();
        }, this);
        return this;
    }

});

module.exports = TagsList;