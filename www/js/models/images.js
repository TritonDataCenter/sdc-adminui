/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Img = require('./image');
var api = require('../request');
var PageableCollection = require('./pageableCollection');

var ImagesCollection = PageableCollection.extend({
    model: Img,
    url: '/api/images'
});
ImagesCollection.hasExternalNic = function (cb) {
    api.get('/api/imgapi-external-nic-status').end(function (res) {
        if (res.ok) {
            cb(null, res.body);
        } else {
            cb(res.body);
        }
    });
};

module.exports = ImagesCollection;
