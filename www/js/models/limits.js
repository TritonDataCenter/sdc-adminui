/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var Collection = require('./collection');
var Limit = require('./limit');

var Limits = Collection.extend({
    model: Limit,
    url: function() {
        return _.str.sprintf('/api/users/%s/limits', this.user);
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
