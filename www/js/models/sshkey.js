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
        console.log(this.collection);

        this.user = options.user || this.collection.user;
        this.account = options.account || this.collection.account;
    }
});
