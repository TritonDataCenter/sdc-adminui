define(function(require) {
    var SSHKey = require('models/sshkey');
    var SSHKeys = Backbone.Collection.extend({
        model: SSHKey,
        initialize: function(options) {
            if (typeof(options.user) === 'object') {
                this.uuid = options.user.get('uuid');
            } else if(typeof(options.user) == 'string') {
                this.uuid = options.user;
            }

            if (typeof(this.uuid) !== 'string') {
                throw new TypeError('options.user {string|object} required');
            }
        },
        parse: function(response) {
            return _.map(response, function(item) {
                item.user = this.uuid;
                console.log(item);
                return item;
            }, this);
        },
        url: function() {
            return '/_/users/' + this.uuid + '/keys';
        }
    });

    return SSHKeys;
});