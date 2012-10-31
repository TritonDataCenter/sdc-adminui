/* * Packages **/

var typify = require('./typify').typify;
var stringify = require('./typify').stringify;

module.exports = {};

module.exports.add = function(req, res, next) {
    var params = stringify(req.body);
    req.sdc.package.add(params, function(err, pkg) {
      if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(typify(pkg));
        }
    });
};

module.exports.del = function(req, res, next) {
    req.sdc.pacakge.del(req.params.uuid, function(err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
        }
    });
};

module.exports.update = function(req, res, next) {
    req.sdc.package.get(req.params.uuid, function(err, pkg) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        var pkg = pkg;
        var changes = stringify(req.body);

        // req.log.info(pkg, "PACKAGE");
        // req.log.info(req.body, 'BODY');

        req.sdc.package.update(pkg, changes, function(err, p) {
            if (err) {
                req.log.fatal(err);
                return next(err);
            }
            res.send(p);
        });
    });
};

module.exports.list = function(req, res, next) {
    req.sdc.package.list(function(err, packages) {
        if (err) {
            return next(err);
        } else {
            res.send(typify(packages));
        }
    });
};