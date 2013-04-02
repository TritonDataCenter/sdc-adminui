define(function(require) {
    var Nics = Backbone.Collection.extend({
        url: '/_/nics',
        initialize: function(options) {
            this.belongs_to_type = options.belongs_to_type;
            this.belongs_to_uuid = options.belongs_to_uuid;
        },

        fetchNics: function() {
            var query = {};

            if (this.belongs_to_uuid) {
                query.belongs_to_uuid = this.belongs_to_uuid;
            }

            if (this.belongs_to_type) {
                query.belongs_to_type = this.belongs_to_type;
            }

            this.fetch({data: query});
        }
    });
    return Nics;
});