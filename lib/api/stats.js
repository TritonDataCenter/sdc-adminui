/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var async = require('async');
var _ = require('underscore');

module.exports = {
    allStats: function allStats(req, res, next) {
        async.parallel([
            serverCount.bind(null, req),
            vmCount.bind(null, req),
            serverMemory.bind(null, req)
        ], function callback(err, stats) {
            var result = {};
            if (!err && stats.length) {
                stats.forEach(function (data) {
                    Object.keys(data).forEach(function (key) {
                        result[key] = data[key];
                    });
                });
            }
            req.log.info(result);
            res.send(result);
            return next();
        });
    }
};

function serverCount(req, cb) {
    var stats = {};

    req.sdc[req.dc].cnapi.listServers(function listServersRes(err, servers) {
        if (err) {
            req.log.fatal('Error retrieving servers', err);
            return cb(err);
        }
        stats.total = servers.length;
        stats.reserved = _.where(servers, {reserved: true}).length;
        stats.unreserved = _.where(servers, {reserved: false}).length;
        return cb(null, {serverCount: stats });
    });
}

function vmCount(req, cb) {
    req.sdc[req.dc].vmapi.countVms({state: 'active'}, function listVmsRes(err, count) {
        if (err) {
            req.log.error(err, 'Error retreiving vm count');
            return cb(err);
        }

        return cb(null, {
            vmCount: {
                total: count || ''
            }
        });
    });
}


function serverMemory(req, cb) {
    var stats = {
        provisionable: 0,
        available: 0,
        total: 0
    };
    req.sdc[req.dc].cnapi.listServers({'setup': true, 'extras': 'memory'}, function (listErr, servers) {
        if (listErr) {
            req.log.fatal(listErr, 'Error retrieving servers list');
            return cb(listErr);
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

        return cb(null, {serverMemory: stats});
    });
}
