var Backbone = require('backbone');
var _ = require('underscore');

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
        this.model = new Backbone.Model();
        this.model.on('change:editing', function(model) {
            this.trigger('change:editing', this.model.get('editing'));
            if (this.model.get('editing') === true) {
                this.$el.addClass('editing');
            } else {
                this.$el.removeClass('editing');
            }
        }, this);

        if (options.editing) {
            this.model.set({ editing: options.editing });
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
        this.model.set({ editing: true });
    },

    save: function() {
        this.tag.name = this.$('input[name=name]').val();
        this.tag.value = this.$('input[name=value]').val();
        if ((!this.tag.name.length) || (!this.tag.value.length)) {
            return false;
        }
        this.trigger('save', this.tag);
        this.model.set({editing: false});
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
    events: { 'click .add-tag': 'addTag'},
    modelEvents: {'sync': 'render'},

    initialize: function(options) {
        if (! this.model) {
            throw new TypeError('options.model required');
        }

        this.tagsProperty = options.tagsProperty || 'tags';

        this.getTags = function() {
            return this.model.get(this.tagsProperty) || {};
        }.bind(this);

        this.saveTags = function(tags) {
            var params = {};
            params[this.tagsProperty] = tags;
            return this.model.save(params, {patch: true});
        }.bind(this);
    },

    addTag: function() {
        var self = this;
        var addView = new EditingView({ editing: true });

        addView.on('cancel', function() {
            self.$('.add-tag').show();
            addView.remove();
            if (_(self.getTags).size() === 0) {
                this.$('.table').hide();
                this.$('.zero-state').show();
            }
        });

        addView.on('save', function(tag) {
            var tags = this.getTags();
            tags[tag.name] = tag.value;
            this.saveTags(tags);
        }, this);

        addView.render();

        this.$('tfoot').append(addView.$el);
        this.$('.add-tag').hide();
        this.$('.table').show();
        this.$('.zero-state').hide();

        addView.focus();
    },

    onEditMode: function(editing) {
        if (editing) {
            this.$('.add-tag').css('visiblity', 'hidden');
        } else {
            this.$('.add-tag').css('visiblity', 'visible');
        }
    },

    onRender: function() {
        var tags = this.getTags();
        if (_(tags).size() === 0) {
            this.$('.table').hide();
            this.$('.zero-state').show();
        } else {
            this.$('.table').show();
            this.$('.zero-state').hide();
        }

        var arrTags = _.pairs(tags);
        var sortedTags = _.sortBy(arrTags, function(val, i) {
            return val[0];
        });
        _.each(sortedTags, function(val, i) {
            var tn = val[0];
            var tv = val[1];
            var view = new EditingView({ name: tn, value: tv });
            view.on('save', function(tag) {
                var tags = this.getTags();
                delete tags[tn];
                tags[tag.name] = tag.value;
                this.saveTags(tags);
            }, this);

            view.on('change:editing', this.onEditMode, this);

            view.on('remove', function(tag) {
                var confirm = window.confirm("Are you sure you want to remove " + tag.name + "?");
                if (false === confirm) {
                    return;
                }

                var tags = this.getTags();
                delete tags[tag.name];

                this.saveTags(tags).done(function() {
                    view.$el.fadeOut(200, function() {
                        view.remove();
                    });
                });

            }, this);

            this.$('tbody').append(view.$el);
            view.render();
        }, this);
    }

});

module.exports = TagsList;
