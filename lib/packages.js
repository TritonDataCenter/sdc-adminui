var typify = require('./typify').typify;
var stringify = require('./typify').stringify;
var _ = require('underscore');

module.exports = {};

module.exports.add = function(req, res, next) {
    var params = stringify(req.body);

    if (!params.owner_uuid || params.owner_uuid.length === 0) {
        delete params.owner_uuid;
    }

    if (params['active'] === false || !params['active']) {
        params['active'] = 'false';
    }
    if (params['default'] === false || !params['default']) {
        params['default'] = 'false';
    }
    req.sdc.package.add(params, function(err, pkg) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(typify(pkg));
            return next();
        }
    });
};



module.exports.del = function(req, res, next) {
    req.sdc.package.del(req.params.uuid, function(err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};


module.exports.get = function(req, res, next) {
    req.sdc.package.get(req.params.uuid, function(err, pkg) {
        if (err) {
            return next(err);
        } else {
            delete pkg.controls;
            res.send(typify(pkg));
            return next();
        }
    });
};


module.exports.update = function(req, res, next) {
    req.sdc.package.get(req.params.uuid, function(err, pkg) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }

        delete pkg.controls;

        var changes = _.extend(pkg, req.body);
        if (!changes.owner_uuid || changes.owner_uuid.length === 0) {
            delete changes.owner_uuid;
        }

        if (changes['active'] === false || !changes['active']) {
            changes['active'] = 'false';
        }

        if (changes['default'] === false || !changes['default']) {
            changes['default'] = 'false';
        }

        req.log.info('sdc-clients.package.update',
            {original: pkg, changes: changes}
        );

        req.sdc.package.update(stringify(pkg), stringify(changes), function(err, p) {
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
    req.sdc.package.list(function(err, packages) {
        if (err) {
            return next(err);
        }

        packages = packages.map(function(p) {
            delete p.controls;
            return p;
        });

        res.send(typify(packages));
        return next();
    });
};
