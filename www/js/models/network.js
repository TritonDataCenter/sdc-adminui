/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Model = require('./model');
var api = require('../request');

module.exports = Model.extend({
    urlRoot: '/api/networks',
    idAttribute: 'uuid',

    update: function(attrs, cb) {
        api.put(this.url()).send(attrs).end(cb);
    }
});
