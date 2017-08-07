/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var PageableCollection = require('./pageableCollection');


module.exports = PageableCollection.extend({
    model: Backbone.Model.extend({
        idAttribute: 'ip',
        urlRoot: function () {
            return '/api/networks/' + this.get('network_uuid') + '/ips';
        }
    }),
    url: function () {
        return '/api/networks/' + this.uuid + '/ips';
    },
    initialize: function (options) {
        this.uuid = options.uuid;
    },
    state: {
        pageSize: 50,
        pageSizes: [{size: 10}, {size: 25}, {size: 50}, {size: 100}, {size: 255}],
        totalPages: null
    }
});
