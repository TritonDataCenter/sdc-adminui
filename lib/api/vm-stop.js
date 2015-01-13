var async = require('async');

module.exports = {
    mount: function (server, pre) {
        server.post('/api/vm-stop', pre, function vmStopHandler(req, res, next) {
            var vms = req.body;

            async.map(vms, function stopEachVm(vm, cb) {
                req.sdc[req.dc].vmapi.stopVm({uuid:vm}, function stopVmCb(err, job) {
                    cb(err, job);
                });
            }, function done(err, results) {
                if (err) {
                    req.log.fatal('Error stopping vms', err);
                    return next(err);
                }

                res.send(results);
                return next();
            });
        });
    }
};
