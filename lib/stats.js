var async = require('async');
var fs = require('fs');

module.exports = {
    vmCount: function(req, res, next) {
        req.sdc[req.dc].vmapi.get('/vms?state=active&limit=0', function(err, obj, vmReq, vmRes) {
            if (err) {
                req.log.fatal(err, 'Error retreiving vm count');
                return next(err);
            }

            var c = {total: vmRes.headers['x-joyent-resource-count'] || ''};
            res.send(c);
            return next();
        });
    },
    serverMemory: function(req, res, next) {
        var stats = {
            available: 0,
            total: 0
        };
        req.sdc[req.dc].cnapi.listServers({'setup': true, 'extras': 'memory'}, function(err, servers) {
            if (err) {
                req.log.fatal(err, 'Error retreiving servers list');
                return next(err);
            }
            servers.forEach(function(srv) {
                if (srv.hostname.slice(0, 2) !== 'RA') {
                    stats.available += (srv.memory_available_bytes || 0);
                    stats.total += (srv.memory_total_bytes || 0);
                }
            });

            res.send(stats);
        });
    },
    serverCount: function(req, res, next) {
        var stats = {};
        var tasks = [
            function total(callback) {
                req.sdc[req.dc].cnapi.listServers({}, function(err, servers) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    stats.total = servers.length;
                    callback(null);
                });
            },
            function reserved(callback) {
                req.sdc[req.dc].cnapi.listServers({reserved:true}, function(err, servers) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    stats.reserved = servers.length;
                    callback(null);
                });
            },
            function unreserved(callback) {
                req.sdc[req.dc].cnapi.listServers({reserved:false}, function(err, servers) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    stats.unreserved = servers.length;
                    callback(null);
                });
            }
        ];

        async.parallel(tasks, function(err) {
            if (err) {
                return next(err);
            }

            res.send(stats);
            return next();
        });
    }
};
