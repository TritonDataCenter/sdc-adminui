/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');

var Collection = require('./collection');

var SSHKey = require('./sshkey');

var SSHKeys = Collection.extend({
    model: SSHKey,
    url: function() {
        if (this.account) {
            return _.str.sprintf('/api/users/%s/%s/keys', this.account, this.user);
        } else {
            return '/api/users/' + this.user + '/keys';
        }
    },
    initialize: function(models, options) {
        options = options || {};
        if (typeof(options.user) === 'object') {
            this.user = options.user.get('uuid');
        } else if (typeof(options.user) === 'string') {
            this.user = options.user;
        }

        if (options.account) {
            this.account = options.account;
        }

        if (typeof(this.user) !== 'string') {
            throw new TypeError('options.user {string|object} required');
        }
    },
    parse: function(response) {
        return _.map(response, function(item) {
            item.user = this.user;
            return item;
        }, this);
    }
});

module.exports = SSHKeys;
