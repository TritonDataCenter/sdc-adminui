var async = require('async');

module.exports = {
    mount: function(server, pre) {
        server.post('/api/vm-reboot', pre, function(req, res, next) {
            var vms = req.body;

            async.map(vms, function rebootEachVm(vm, cb) {
                req.sdc[req.dc].vmapi.rebootVm({uuid:vm}, function(err, job) {
                    cb(err, job);
                });
            }, function done(err, results) {
                if (err) {
                    req.log.fatal('Error rebooting vms', err);
                    return next(err);
                }

                res.send(results);
                return next();
            });
        });
    }
};
