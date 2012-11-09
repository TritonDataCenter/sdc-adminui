var assert = require('assert');
var restify = require('restify');

module.exports.list = function(req, res, next) {
  req.sdc[req.dc].napi.listNetworks(function listNetworks(err, obj) {
    if (err) {
        req.log.fatal(err);
        return next(err);
    }

    return res.send(obj);
  });
};

module.exports.listNicTags = function(req, res, next) {
    req.sdc[req.dc].napi.listNicTags(function listNicTags(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

module.exports.get = function(req, res, next) {
  req.sdc[req.dc].napi.getNetwork(req.params.uuid, function getNetwork(err, obj) {
    if (err) {
        req.log.fatal(err);
        return next(err);
    }

    return res.send(obj);
  });
};

module.exports.create = function(req, res, next) {
    req.sdc[req.dc].napi.createNetwork(req.body, function(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};


module.exports.listIPs = function(req, res, next) {
    var networkid = req.params.uuid;
    var params = {};
    req.sdc[req.dc].napi.listIPs(networkid, params, function(err, ips) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(ips);
            return next();
        }
    });
};
