var async = require('async');

module.exports = {
    mount: function (server, pre) {
        server.post('/api/vm-start', pre, function startVmHandler(req, res, next) {
            var vms = req.body;

            async.map(vms, function startEachVm(vm, cb) {
                req.sdc[req.dc].vmapi.startVm({uuid:vm}, function startVmCb(err, job) {
                    cb(err, job);
                });
            }, function done(err, results) {
                if (err) {
                    req.log.fatal('Error starting vms', err);
                    return next(err);
                }

                res.send(results);
                return next();
            });
        });
    }
};
