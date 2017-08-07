/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var Model = require('./model');
var api = require('../request');

var Service = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/api/services',
    update: function (attrs, cb) {
        var req = api.post(this.url()).send(attrs);
        req.end(function (res) {
            if (res.ok) {
                cb(null, res.body);
                return;
            }
            cb(res.body);
        });
    }
});

module.exports = Service;
