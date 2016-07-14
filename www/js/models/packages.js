/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var Package = require('./package');
var Collection = require('./collection');

var Packages = Collection.extend({
    model: Package,
    url: '/api/packages',
    fetchActive: function () {
        return this.fetch({params: {active: true}});
    }
});

module.exports = Packages;
