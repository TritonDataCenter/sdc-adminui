module.exports = {
    vm_count: function(req, res, next) {
        req.sdc[req.dc].vmapi.get('/vms?limit=0', function(err, obj, vmReq, vmRes) {
            var c = vmRes.headers['x-joyent-resource-count'];
            res.send({ total: c });
            return next();
        });
    },
    server_count: function(req, res, next) {
        req.sdc[req.dc].cnapi.listServers({}, function(err, servers) {
            if (err) {
                return next(err);
            }
            res.send({total: servers.length });

            return next();
        });
    }
}