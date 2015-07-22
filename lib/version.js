/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var exec = require('child_process').exec;

module.exports = {
    getGitInfo: function (callback) {
        exec('git describe --long --dirty --abbrev=10 --tags --always', function (err, stdout) {
            if (err) {
                callback(err);
            }
            /* JSSTYLED */
            if (stdout && typeof stdout === 'string') {
                callback(null, stdout.split('\n')[0]);
            }
        });
    }
};
