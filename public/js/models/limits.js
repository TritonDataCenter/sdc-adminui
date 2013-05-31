var _ = require('underscore');
var Collection = require('./collection');
var Limit = require('./limit');

var Limits = Collection.extend({
    model: Limit,
    url: function() {
        return _.str.sprintf('/_/users/%s/limits', this.user);
    },
    initialize: function(objects, options) {
        Collection.prototype.initialize.call(this, arguments);
        if (typeof(options.user) === 'undefined') {
            throw new TypeError('options.user required');
        }
        this.user = options.user;
    }
});

module.exports = Limits;
