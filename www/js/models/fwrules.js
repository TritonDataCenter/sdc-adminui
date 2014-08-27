/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Collection = require('./collection');
var FWRule = require('./fwrule');
var FWRules = Collection.extend({
    model: FWRule,
    url: function() {
        return '/api/fw/rules';
    }
});

module.exports = FWRules;
