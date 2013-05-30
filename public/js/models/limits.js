var Collection = require('./collection');
var _ = require('underscore');
var Limit = require('./limit');

var Limits = Collection.extend({
    model: Limit,
    url: function() {
        return _.str.sprintf('/_/users/%s/limits', this.user);
    },
    initialize: function(objects, options) {
        if (typeof(options.user) === 'undefined') {
            throw new TypeError('options.user required');
        }
        this.user = options.user;
    }
});

module.exports = Limits;
