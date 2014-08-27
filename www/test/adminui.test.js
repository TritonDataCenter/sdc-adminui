/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var adminui = require('./adminui');
var VMView = require('./views/vm');
var assert = require('assert');

suite('Array', function() {
    suite('#indexOf()', function() {
        test('should return -1 when not present', function() {
            assert.equal(-1, [1, 2, 3].indexOf(4));
        });
    });
});
