/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports = {
    simulateLatency: function simulateLatency() {
        var fn = function (req, res, next) {
            if (req.url.indexOf('/_/') !== -1) {
                return setTimeout(function () {
                    return next();
                }, Math.floor((Math.random() * 100) + 100));
            } else {
                return next();
            }
        };
        return fn;
    }
};
