var Note = require('./note');

var Backbone = require('backbone');

var Notes = module.exports = Backbone.Collection.extend({
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