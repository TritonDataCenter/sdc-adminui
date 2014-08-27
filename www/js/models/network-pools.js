/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var NetworkPool = require('./network-pool');

var Collection = require('./collection');
/*
    GET /network_pools/3b5913ec-42e6-4803-9c0b-c9b1c5603520
    {
      "uuid": "3b5913ec-42e6-4803-9c0b-c9b1c5603520",
      "name": "internal",
      "networks": [
        "0e70de36-a40b-4ac0-9429-819f5ff822bd",
        "9f2eada0-529b-4673-a377-c249f9240a12"
      ]
    }
*/

module.exports = Collection.extend({
    model: NetworkPool,
    url: "/api/network_pools"
});

