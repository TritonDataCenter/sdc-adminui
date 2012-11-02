var assert = require('assert');

module.exports.list = function(req, res, next) {
  req.sdc['coal'].napi.listNetworks(function listNetworks(err, obj) {
    if (err) {
        req.log.fatal(err);
        return next(err);
    }

    return res.send(obj);
  });
};

module.exports.get = function(req, res, next) {
  req.sdc['coal'].napi.getNetwork(req.params.uuid, function getNetwork(err, obj) {
    if (err) {
        req.log.fatal(err);
        return next(err);
    }

    return res.send(obj);
  });
};


module.exports.listIPs = function(req, res, next) {
    var networkid = req.params.uuid;
    var params = {};
    req.sdc['coal'].napi.listIPs(networkid, params, function(err, ips) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            return res.send(ips);
        }
    });
};