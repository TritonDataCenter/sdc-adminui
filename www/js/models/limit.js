/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

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
