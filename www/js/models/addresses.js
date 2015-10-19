/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');


module.exports = Backbone.Collection.extend({
    model: Backbone.Model.extend({
        idAttribute: 'ip',
        urlRoot: function () {
            this.collection.url();
        }
    }),

    url: function () {
        return '/api/networks/' + this.uuid + '/ips';
    },

    initialize: function (options) {
        this.uuid = options.uuid;
    }
});
