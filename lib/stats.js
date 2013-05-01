var async = require('async');

module.exports = {
    vm_count: function(req, res, next) {
        req.sdc[req.dc].vmapi.get('/vms?limit=0', function(err, obj, vmReq, vmRes) {
            var c = vmRes.headers['x-joyent-resource-count'];
            res.send({ total: c });
            return next();
        });
    },
    server_count: function(req, res, next) {
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
