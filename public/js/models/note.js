define(function(require) {
    var Note = Backbone.Model.extend({
        idAttribute: 'uuid',
        urlRoot: function() {
            return '/_/notes/' + this.item_uuid;
        },
        initialize: function(options) {
            this.item_uuid = options.item_uuid;
        }
    });

    return Note;
});