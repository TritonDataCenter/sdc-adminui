var Model = require('./model');
var _ = require('underscore');

var Limit = Model.extend({
    idAttribute: 'datacenter',
    urlRoot: function() {
        return _.str.sprintf('/api/users/%s/limits', this.user);
    },
    initialize: function(attrs, options) {
        if (this.collection) {
            this.user = this.collection.user;
        } else {
            this.user = options.user;
        }
    }
});

module.exports = Limit;
