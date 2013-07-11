var assert = require('assert');
var _ = require('underscore');

/**
 * Params
 * ===
 * params.uuid
 */
module.exports.get = function getServer(req, res, next) {
    req.sdc[req.dc].cnapi.getServer(req.params.uuid, function listServersCallback(err, obj, _req, _res) {
        if (err) {
            req.log.fatal(err, 'CNAPI Error retrieving server');
            return next(err, _res.httpCode);
        }

        res.send(obj);
        return next();
    });
};

module.exports.update = function updateServer(req, res, next) {
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
    req.sdc[req.dc].cnapi.rebootServer(req.params.uuid, function(err, job) {
        if (err) {
            req.log.fatal(err, 'CNAPI: Failed to reboot server');
            return next(err);
        }

        res.send(job);
        return next();
    });
};

module.exports.setup = function setupServer(req, res, next) {
    if (req.body) {
        var opts = {kernel_args: req.body};
        req.sdc[req.dc].cnapi.updateServer(req.params.uuid, opts, function(err) {
            if (err) {
                req.log.fatal(err, 'Error updating boot params on cnapi');
                return next(err);
            }
            _setupServer();
        });
    }

    function _setupServer() {
        req.sdc[req.dc].cnapi.setupServer(req.params.uuid, function setupServerCallback(err, obj, _req, _res) {
            if (err) {
                req.log.error(err);
                return next(err);
            }

            res.send(obj);
            return next();
        });
    }
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
    var params = _.clone(req.query);
    delete params.hostname;

    Object.keys(params).forEach(function(key) {
        if (!key || !params[key].length) {
            delete params[key];
        }
    });

    params.extras = 'sysinfo';
    req.log.info({query: params}, 'Listing servers');
    req.sdc[req.dc].cnapi.listServers(params, function(err, servers) {
        if (err) {
            req.log.error(err);
            return next(err);
        }

        if (req.query.hostname) {
            servers = _.filter(servers, function(s) {
                return s.hostname.toLowerCase().startsWith(req.query.hostname.toLowerCase());
            });
        }

        servers = servers.map(function(s) {
            if (s.sysinfo['SDC Version']) {
                s.sdc_version = s.sysinfo['SDC Version'];
            } else {
                s.sdc_version = '6.5';
            }
            return s;
        });

        res.send(servers);
        return next();
    });
};

module.exports.updateNics = function updateNics(req, res, next) {
    req.sdc[req.dc].cnapi.updateNics(req.params.uuid, req.body, function(err, obj) {
        if (err) {
            req.log.fatal(err, 'Error updating nics');
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};
