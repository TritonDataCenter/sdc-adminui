var assert = require('assert');

/**
 * Params
 * ===
 * params.uuid
 */
module.exports.get = function getServer(req, res, next) {
    req.sdc[req.dc].cnapi.getServer(req.params.uuid, function listServersCallback(err, obj, _req, _res) {

        if (err) {
            req.log.fatal(err, 'CNAPI Error retrieving server');
            return next(err, _res.statusCode);
        }

        res.send(obj);
        return next();
    });
};

module.exports.update = function updateServer(req, res, next) {
    req.log.info(typeof(req.body), 'body');
    req.sdc[req.dc].cnapi.updateServer(req.params.uuid, req.body, function(err, obj) {
        if (err) {
            req.log.fatal(err, 'CNAPI Error updating server');
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};

module.exports.factoryReset = function factoryReset(req, res, next) {
    var uuid = req.params.uuid;
    req.sdc[req.dc].cnapi.put('/servers/' + req.params.uuid + '/factory-reset', {}, function(err, obj) {
        if (err) {
            req.log.error(err);
            return next(err);
        }

        res.send(obj);
        return next();
    });
};

module.exports.reboot = function reboot(req, res, next) {
    var uuid = req.params.uuid;
    req.sdc[req.dc].cnapi.post('/servers/' + req.params.uuid + '/reboot', {}, function(err, obj) {
        if (err) {
            req.log.fatal(err, 'CNAPI: Failed to reboot server');
            return next(err);
        }

        res.send(obj);
        return next();
    });
};

module.exports.setup = function setupServer(req, res, next) {
    req.sdc[req.dc].cnapi.setupServer(
    req.params.uuid, function setupServerCallback(err, obj, _req, _res) {
        if (err) {
            req.log.error(err);
            return next(err);
        }

        res.send(obj);
        return next();
    });
};

module.exports.del = function deleteServer(req, res, next) {
    var uuid = req.params.uuid;
    req.sdc[req.dc].cnapi.del('/servers/'+uuid, function(err, obj) {
        if (err) {
            req.log.error(err, 'CNAPI Error');
            return next(err);
        }
        res.send(obj);
        return next();
    });
};

module.exports.list = function listServers(req, res, next) {
    req.sdc[req.dc].cnapi.listServers(req.params, function(err, obj) {
        if (err) {
            req.log.error(err);
            return next(err);
        }

        res.send(obj);
        return next();
    });
};