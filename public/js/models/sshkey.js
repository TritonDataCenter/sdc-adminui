define(function(require) {
    return Backbone.Model.extend({
        urlRoot: function() {
            return _.str.sprintf('/_/users/%s/keys', this.user);
        },
        idAttribute: 'fingerprint',
        initialize: function(options) {
            if (! options.user) {
                throw new TypeError('options.user required');
            }

            this.user = options.user;
        }
    });
});