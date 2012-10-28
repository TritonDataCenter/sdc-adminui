/* * Packages **/

var typify = require('./typify');

module.exports = {};

module.exports.add = function(req, res, next) {
    req.sdc.package.add(req.body, function(err, pkg) {
      if (err) {
            return next(err);
        } else {
            res.send(typify(pkg));
        }
    });
}

module.exports.del = function(req, res, next) {
    req.sdc.pacakge.del(req.params.uuid, function(err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
        }
    });
},

module.exports.list = function(req, res, next) {
    req.sdc.package.list(function(err, packages) {
        if (err) {
            return next(err);
        } else {
            res.send(typify(packages));
        }
    });
}