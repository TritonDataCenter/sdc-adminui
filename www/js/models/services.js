/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Collection = require('./collection');
var Service = require('./service');

var Services = Collection.extend({
    model: Service,
    url: '/api/services'
});

module.exports = Services;
