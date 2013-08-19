var Backbone = require('backbone');


module.exports = Backbone.Collection.extend({
    model: Backbone.Model.extend({
        idAttribute: 'ip',
        urlRoot: function() {
            this.collection.url();
        },
    }),

    url: function() {
        return '/_/networks/' + this.uuid + '/ips';
    },

    initialize: function(options) {
        this.uuid = options.uuid;
    }
});
