var async = require('async');

module.exports = {
    vmCount: function(req, res, next) {
        req.sdc[req.dc].vmapi.get('/vms?limit=0', function(err, obj, vmReq, vmRes) {
            var c = vmRes.headers['x-joyent-resource-count'];
            res.send({ total: c });
            return next();
        });
    },
    serverMemory: function(req, res, next) {
        var stats = {
            available: 0,
            total: 0
        };
        req.sdc[req.dc].cnapi.listServers({'setup': true, 'extras': 'memory'},
        function(err, servers) {
            servers.forEach(function(srv) {
                stats.available += srv.memory_available_bytes;
                stats.total += srv.memory_total_bytes;
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
                    }
                    stats.total = servers.length;
                    callback(null);
                });
            },
            function reserved(callback) {
                req.sdc[req.dc].cnapi.listServers({reserved:true}, function(err, servers) {
                    if (err) {
                        callback(err);
                    }
                    stats.reserved = servers.length;
                    callback(null);
                });
            },
            function unreserved(callback) {
                req.sdc[req.dc].cnapi.listServers({reserved:false}, function(err, servers) {
                    if (err) {
                        callback(err);
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
