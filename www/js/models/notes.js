var _ = require('underscore');
var Backbone = require('backbone');

var Note = require('./note');


var Notes = module.exports = Backbone.Collection.extend({
    model: Note,
    url: function() {
        return '/api/notes/' + this.item_uuid;
    },
    parse: function(col) {
        return _.map(col, function(obj) {
            obj.created = new Date(obj.created);
            return obj;
        });
    }
});
