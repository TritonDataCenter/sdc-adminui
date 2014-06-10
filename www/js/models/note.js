var Backbone = require('backbone');


var Note = Backbone.Model.extend({
    idAttribute: 'uuid',
    urlRoot: function() {
        return '/api/notes/' + this.item_uuid;
    },
    initialize: function(options) {
        this.item_uuid = options.item_uuid;
    }
});

module.exports = Note;
