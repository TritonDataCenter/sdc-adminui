var Backbone = require('backbone');
var _ = require('underscore');


var SSHKey = require('./sshkey');
var SSHKeys = Backbone.Collection.extend({
    model: SSHKey,
    url: function() {
        return '/_/users/' + this.uuid + '/keys';
    },
    initialize: function(options) {
        if (typeof(options.user) === 'object') {
            this.uuid = options.user.get('uuid');
        } else if (typeof(options.user) === 'string') {
            this.uuid = options.user;
        }

        if (typeof(this.uuid) !== 'string') {
            throw new TypeError('options.user {string|object} required');
        }
    },
    parse: function(response) {
        return _.map(response, function(item) {
            item.user = this.uuid;
            return item;
        }, this);
    }
});

module.exports = SSHKeys;
