/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Model = require('./model');

var Service = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/api/services'
});

module.exports = Service;
