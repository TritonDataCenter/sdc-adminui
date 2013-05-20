var typify = require('./typify').typify;
var stringify = require('./typify').stringify;
var _ = require('underscore');

module.exports = {};

module.exports.add = function(req, res, next) {
    var params = stringify(req.body);

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

        var changes = req.body;
        if (changes['active'] === false || !changes['active']) {
            changes['active'] = 'false';
        }

        if (changes['default'] === false || !changes['default']) {
            changes['default'] = 'false';
        }

        req.sdc.package.update(stringify(pkg), stringify(changes), function(err, p) {
            if (err) {
                req.log.fatal(err);
                return next(err);
            }
            done();
        });
    });

    function done() {
        req.sdc.package.get(req.params.uuid, function(err, pkg) {
            res.send(typify(pkg));
            return next();
        });
    }
};



module.exports.list = function(req, res, next) {
    req.sdc.package.list(function(err, packages) {
        if (err) {
            return next(err);
        }

        packages = packages.map(function(p) {
            if (p.networks && p.networks.length && typeof(p.networks) === 'string') {
                p.networks = JSON.parse(p.networks);
            }
            return p;
        });

        res.send(typify(packages));
        return next();
    });
};
