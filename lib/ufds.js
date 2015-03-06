/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var sdc = require('sdc-clients');
var assert = require('assert-plus');

var UFDS_DEFAULT_CONNECT_TIMEOUT = 4000;
var UFDS_DEFAULT_CLIENT_TIMEOUT = 2000;

module.exports = {
    createUfdsClient: function (config) {
        assert.object(config, 'ufds configuration required');

        config.retry = { maxDelay: 8000 };
        config.clientTimeout = config.clientTimeout || UFDS_DEFAULT_CLIENT_TIMEOUT;
        config.connectTimeout = config.connectTimeout || UFDS_DEFAULT_CONNECT_TIMEOUT;

        var ufds = new sdc.UFDS(config);
        ufds.setMaxListeners(15);

        var log = config.log;
        log.info('Connecting to UFDS: ', config.url);

        ufds.on('timeout', function (msg) {
            log.warn({message: msg}, 'UFDS client timeout (recycling)');
            try {
                ufds.client.socket.destroy();
            } catch (e) {
                log.fatal({err: e}, 'could not destroy the timed out UFDS socket');
            }
        });

        ufds.once('connect', function () {
            log.info('Connected to UFDS: ', config.url);
            ufds.removeAllListeners('error');

            ufds.on('connect', function () {
                log.info('UFDS Reconnected');
            });

            ufds.on('close', function () {
                log.info('UFDS Connection Closed');
            });

        });

        ufds.on('error', function (err) {
            log.warn(err, 'UFDS: unexpected error occurred');
        });

        return ufds;
    }
};
