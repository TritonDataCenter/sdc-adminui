var Backbone = require('backbone');
var moment = require('moment');


var Notes = require('../models/notes');
var Note = require('../models/note');
var User = require('../models/user');

var NotesItemView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/notes-item.hbs'),
    tagName: 'li',
    events: {
        'click .actions a': 'toggleArchive'
    },
    initialize: function() {
        this.user = new User({uuid: this.model.get('owner_uuid')});
        this.user.fetch();
    },
    userBindings: {'.author': 'cn'},
    noteBindings: {
        '.note': 'note',
        '.date': {
            observe: 'created',
            onGet: function(created) {
                var c = moment(created);
                return c.format('LLL');
            }
        },
        ':el': {
            attributes: [{
                name: 'class',
                observe: 'archived',
                onGet: function(val) {
                    if (val.length) {
                        return 'archived';
                    } else {
                        return '';
                    }
                }
            }]
        },
        '.actions a i': {
            attributes: [{
                name: 'class',
                observe: 'archived',
                onGet: function(val) {
                    if (val.length) {
                        return 'icon-undo';
                    } else {
                        return 'icon-trash';
                    }
                }
            }]
        }
    },
    toggleArchive: function() {
        if (this.model.get('archived') && this.model.get('archived').length) {
            this.unarchiveNote();
        } else {
            this.archiveNote();
        }
    },
    unarchiveNote: function() {
        this.model.save({archived: false });
    },
    archiveNote: function() {
        this.model.save({archived: true });
    },
    onRender: function() {
        this.stickit(this.model, this.noteBindings);
        this.stickit(this.user, this.userBindings);
    }

});





var EmptyNoteView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    attributes: {
        'class': 'empty'
    },
    template: function(data) { return 'There are no notes yet...'; }
});




var View = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/notes.hbs'),

    itemView: NotesItemView,

    itemViewContainer: 'ul',

    emptyView: EmptyNoteView,

    ui: {
        'noteField': 'textarea',
        'saveButton': 'button.add-note'
    },

    events: {
        'input textarea': 'noteChanged',
        'click button': 'saveNote'
    },

    noteChanged: function() {
        if (this.ui.noteField.val().length) {
            this.ui.saveButton.removeAttr('disabled');
        } else {
            this.ui.saveButton.attr('disabled', 'disabled');
        }
    },

    saveNote: function() {
        var self = this;
        var noteText = this.ui.noteField.val();
        var note = new Note({
            item_uuid: this.collection.item_uuid,
            note: noteText
        });
        note.save(null, {
            success: function() {
                self.ui.noteField.val('');
                self.collection.fetch();
            }
        });
    },

    onRender: function() {
        this.ui.saveButton.attr('disabled', 'disabled');
    },

    appendHtml: function(cv, iv, index) {
        var $container = this.getItemViewContainer(cv);
        $container.prepend(iv.$el);
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

module.exports = View;
