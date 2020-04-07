/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 */

/* eslint-disable max-len */
var vasync = require('vasync');
var _ = require('underscore');

module.exports = {
    allStats: function allStats(req, res, next) {
        var result = {};
        vasync.parallel({funcs: [
            function serverCount(cb) {
                var stats = {};

                req.sdc[req.dc].cnapi.listServers(function listServersRes(err, servers) {
                    if (err) {
                        req.log.fatal('Error retrieving servers', err);
                        cb(err);
                        return;
                    }
                    stats.total = servers.length;
                    stats.reserved = _.where(servers, {reserved: true}).length;
                    stats.unreserved = _.where(servers, {reserved: false}).length;
                    result.serverCount = stats;
                    cb(null);
                });
            },

            function vmCount(cb) {
                req.sdc[req.dc].vmapi.countVms({state: 'active'}, function listVmsRes(err, count) {
                    if (err) {
                        req.log.error(err, 'Error retreiving vm count');
                        cb(err);
                        return;
                    }
                    result.vmCount = {
                        total: count || ''
                    };
                    cb(null);
                });
            },

            function serverMemory(cb) {
                var stats = {
                    provisionable: 0,
                    available: 0,
                    total: 0
                };
                req.sdc[req.dc].cnapi.listServers({'setup': true, 'extras': 'memory'}, function (listErr, servers) {
                    if (listErr) {
                        req.log.fatal(listErr, 'Error retrieving servers list');
                        cb(listErr);
                        return;
                    }
                    servers.forEach(function (srv) {
                        if (srv.hostname.slice(0, 2) !== 'RA') {
                            if (srv.memory_provisionable_bytes > 0) {
                                stats.provisionable += (srv.memory_provisionable_bytes || 0);
                            }
                            stats.available += (srv.memory_available_bytes || 0);
                            stats.total += (srv.memory_total_bytes || 0);
                        }
                    });
                    result.serverMemory = stats;

                    cb(null);
                });
            }
        ]}, function callback(err) {
            req.log.info(result);
            res.send(result);
            next();
        });
    }
};
