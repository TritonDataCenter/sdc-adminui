var _ = require('underscore');

module.exports = {};

module.exports.add = function(req, res, next) {
    var params = req.body;
    var pkgclient = req.sdc[req.dc].papi;

    if (!params.owner_uuid || params.owner_uuid.length === 0) {
        delete params.owner_uuid;
    }

    req.log.info(params, 'papi.add');

    pkgclient.add(params, function(err, pkg) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};



module.exports.del = function(req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;
    pkgclient.del(req.params.uuid, function(err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};


module.exports.get = function(req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;
    pkgclient.get(req.params.uuid, function(err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};


module.exports.update = function(req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;


    pkgclient.get(req.params.uuid, function(err, pkg) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }

        var changes = req.body;
        for (var k in req.body) {
            if (!changes[k] || changes[k].length === 0) {
                delete changes[k];
            }
        }


        if (!changes.owner_uuid || changes.owner_uuid.length === 0) {
            delete changes.owner_uuid;
        }


        req.log.info('sdc-clients.package.update',
            {cuuid: req.params.uuid, changes: changes}
        );

        pkgclient.update(pkg, changes, function(err) {
            if (err) {
                req.log.fatal(err);
                return next(err);
            }
            done();
        });
    });

    function done() {
        module.exports.get(req, res, next);
    }
};



module.exports.list = function(req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;
    pkgclient.list(function(err, packages) {
        if (err) {
            return next(err);
        }

        res.send(packages);
        return next();
    });
};
