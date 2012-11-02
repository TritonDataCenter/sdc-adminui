define(function(require) {
    return Backbone.Collection.extend({
        url: function() {
            return '/_/networks/' + this.uuid + '/ips';
        },
        
        initialize: function(options) {
            this.uuid = options.uuid;
        }
    });
});