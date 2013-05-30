var Model = require('./model');
var _ = require('underscore');

var Limit = Model.extend({
    idAttribute: 'datacenter',
    initialize: function(attrs, options) {
        this.user = options.user;
    },
    urlRoot: function() {
        return _.str.sprintf('/_/users/%s/limits', this.user);
    }
});

module.exports = Limit;
