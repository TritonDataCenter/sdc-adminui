define(function(require) {
    var Note = require('models/note');
    
    var Notes = Backbone.Collection.extend({
        model: Note,
        url: function() {
            return '/_/notes/' + this.item_uuid;
        },
        parse: function(col) {
            return _.map(col, function(obj) {
                obj.created = new Date(obj.created);
                return obj;
            });
        }
    });

    return Notes;
});