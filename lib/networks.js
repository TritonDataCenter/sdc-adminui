var assert = require('assert');
var restify = require('restify');
var getRequestHeaders = require('./get-request-headers');

module.exports.list = function(req, res, next) {
    var params = {};

    if (req.params.owner_uuid) {
        params.owner_uuid = req.params.owner_uuid;
    }

    req.sdc[req.dc].napi.listNetworks(params,
        {headers: getRequestHeaders(req) },
        function listNetworks(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }

        return res.send(obj);
    });
};

module.exports.deleteNetwork = function(req, res, next) {
    var uuid = req.params.uuid;

    req.sdc[req.dc].napi.deleteNetwork(
        uuid,
        {},
        {headers: getRequestHeaders(req) },
        function(err, obj)
     {
        if (err) {
            req.log.fatal(err, 'Error deleting network');
            return next(err);
        }

        res.send(obj);
        return next();
    });
};

module.exports.listNicTags = function(req, res, next) {
    req.sdc[req.dc].napi.listNicTags({},
        {headers: getRequestHeaders(req) },
        function listNicTags(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        res.send(obj);
        return next();
    });
};

module.exports.get = function(req, res, next) {
    req.sdc[req.dc].napi.getNetwork(
        req.params.uuid,
        {headers: getRequestHeaders(req)},
        function getNetwork(err, obj)
    {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }

        return res.send(obj);
    });
};

module.exports.create = function(req, res, next) {
    req.sdc[req.dc].napi.listNicTags(
        {},
        {headers: getRequestHeaders(req) },
        function(err, nicTags) {
        var nicTagNames = nicTags.map(function(nt) {
            return nt.name;
        });

        if (req.body.owner_uuids && req.body.owner_uuids.length === 0) {
            delete req.body.owner_uuids;
        }

        if (req.body.nic_tag && (nicTagNames).indexOf(req.body.nic_tag) === -1) {
            req.sdc[req.dc].napi.createNicTag(req.body.nic_tag, function() {
                _createNetwork();
            });
        } else {
            _createNetwork();
        }
    });

    function _createNetwork() {
        req.sdc[req.dc].napi.createNetwork(
            req.body,
            {headers: getRequestHeaders(req)},
            function(err, obj)
        {
            if (err) {
                req.log.fatal(err);
                return next(err);
            } else {
                res.send(obj);
                return next();
            }
        });
    }
};

module.exports.listNics = function(req, res, next) {
    var params = req.params;

    req.sdc[req.dc].napi.listNics(params,
        {headers: getRequestHeaders(req)},
        function(err, ips)
    {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(ips);
            return next();
        }
    });
};


module.exports.listIPs = function(req, res, next) {
    var networkid = req.params.uuid;
    var params = {};
    req.sdc[req.dc].napi.listIPs(networkid,
        params,
        {headers: getRequestHeaders(req)},
    function(err, ips) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(ips);
            return next();
        }
    });
};
