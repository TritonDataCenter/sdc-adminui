var Backbone = require('backbone');
var Model = require('./model');
var _ = require('underscore');

module.exports = Model.extend({
    urlRoot: function() {
        return _.str.sprintf('/api/users/%s/keys', this.user);
    },

    idAttribute: 'fingerprint',

    initialize: function(options) {
        if (!options.user) {
            throw new TypeError('options.user required');
        }

        this.user = options.user;
    }
});
