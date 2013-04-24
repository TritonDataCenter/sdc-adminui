module.exports = {
    listApplications: function(req, res, next) {
        req.sdc[req.dc].sapi.listApplications(req.getQuery(), function(err, obj) {
            if (err) {
                req.log.fatal(err, 'Error retreiving applications');
                return next(err);
            } else {
                res.send(obj);
                return next();
            }
        });
    },
    listInstances: function(req, res, next) {
        req.sdc[req.dc].sapi.listInstances(req.getQuery(), function(err, obj) {
            if (err) {
                req.log.fatal(err, 'Error retreiving instances');
                return next(err);
            } else {
                res.send(obj);
                return next();
            }
        });
    },
    listServices: function(req, res, next) {
        req.sdc[req.dc].sapi.listServices(req.getQuery(), function(err, services) {
            if (err) {
                req.log.fatal(err, 'Error retrieving services');
                return next(err);
            } else {
                res.send(services);
                return next();
            }
        });
    },
    getService: function(req, res, next) {
        req.sdc[req.dc].sapi.getService(req.params.uuid, function(err, service) {
            if (err) {
                req.log.fatal(err, 'Error retrieving service');
                return next(err);
            } else {
                res.send(service);
                return next();
            }
        });
    }
};
