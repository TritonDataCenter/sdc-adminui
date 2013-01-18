define(function(require) {
    var Notes = require('models/notes');
    var Note = require('models/note');

    var NotesItemView = Backbone.Marionette.ItemView.extend({
        template: require('tpl!notes-item'),
        tagName: 'li',
        bindings: {
            '.author': 'owner_uuid',
            '.note': 'note',
            '.date': {
                observe: 'created',
                onGet: function(created) {
                    var year = created.getFullYear();
                    var month = created.getMonth();
                    var day = created.getDate();
                    var h = created.getHours();
                    var m = created.getMinutes();
                    var date = [year, month, day].join('/');
                    var time = [h,m].join(':');
                    return [date, time].join(' ');
                }
            }
        },
        onRender: function() {
            this.stickit();
        }

    });

    var View = Backbone.Marionette.CompositeView.extend({
        template: require('tpl!notes'),

        itemView: NotesItemView,

        itemViewContainer: 'ul',

        events: {
            'click button': 'saveNote'
        },

        saveNote: function() {
            var self = this;
            var noteText = this.$('textarea').val();
            var note = new Note({
                item_uuid: this.collection.item_uuid,
                note: noteText
            });
            note.save(null, {
                success: function() {
                    self.$('textarea').val('');
                    self.collection.fetch();
                }
            });
        },

        initialize: function(options) {
            if (! options.itemUuid) {
                throw new TypeError('options.itemUuid required for notes');
            }

            this.collection = new Notes();
            this.collection.item_uuid = options.itemUuid;
            this.collection.fetch();
        }
    });

    return View;
});