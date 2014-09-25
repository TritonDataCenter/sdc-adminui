/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var async = require('async');
var fs = require('fs');

module.exports = {
    vmCount: function vmCount(req, res, next) {
        req.sdc[req.dc].vmapi.get('/vms?state=active&limit=0', function (err, obj, vmReq, vmRes) {
            if (err) {
                req.log.fatal(err, 'Error retreiving vm count');
                return next(err);
            }

            var c = {total: vmRes.headers['x-joyent-resource-count'] || ''};
            res.send(c);
            return next();
        });
    },
    serverMemory: function serverMemory(req, res, next) {
        var stats = {
            provisionable: 0,
            available: 0,
            total: 0
        };
        req.sdc[req.dc].cnapi.listServers({'setup': true, 'extras': 'memory'}, function (listErr, servers) {
            if (listErr) {
                req.log.fatal(listErr, 'Error retrieving servers list');
                return next(listErr);
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

            res.send(stats);
            return next();
        });
    },
    serverCount: function serverCount(req, res, next) {
        var stats = {};
        var tasks = [
            function total(callback) {
                req.sdc[req.dc].cnapi.listServers({}, function (err, servers) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    stats.total = servers.length;
                    callback(null);
                });
            },
            function reserved(callback) {
                req.sdc[req.dc].cnapi.listServers({reserved:true}, function (err, servers) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    stats.reserved = servers.length;
                    callback(null);
                });
            },
            function unreserved(callback) {
                req.sdc[req.dc].cnapi.listServers({reserved:false}, function (err, servers) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    stats.unreserved = servers.length;
                    callback(null);
                });
            }
        ];

        async.parallel(tasks, function (err) {
            if (err) {
                return next(err);
            }

            res.send(stats);
            return next();
        });
    }
};
