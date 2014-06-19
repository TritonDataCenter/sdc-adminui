var Backbone = require('backbone');
var Model = require('./model');
var _ = require('underscore');

module.exports = Model.extend({
    urlRoot: function() {
        if (this.account) {
            return _.str.sprintf('/api/users/%s/%s/keys', this.account, this.user);
        } else {
            return _.str.sprintf('/api/users/%s/keys', this.user);
        }
    },

    idAttribute: 'fingerprint',

    initialize: function(options) {
        if (!options.user) {
            throw new TypeError('options.user required');
        }

        options = options || {};
        if (this.collection) {
            this.user = this.collection.user;
            this.account = this.collection.account;
        } else {
            this.user = options.user;
            this.account = options.account;
        }
    }
});
