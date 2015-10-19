/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var _ = require('underscore');
var format = require('sys').format;
var getRequestHeaders = require('./get-request-headers');
var utils = require('./utils');
var async = require('async');
var sprintf = require('util').format;
var querystring = require('querystring');

function getSetupStatus(req, server, callback) {
    server.setup_state = server.setup ? 'succeeded' : 'running';
    if (server.setup) {
        return callback(null, server);
    }
    req.sdc[req.dc].workflow.get({
        path: sprintf('/jobs?%s', querystring.stringify({
            server_uuid: server.uuid,
            name: req.config.serverSetupJobName,
            limit: 1
        })),
        headers: getRequestHeaders(req)
    }, function (err, creq, cres, jobs) {
        if (err) {
            return callback(err);
        }
        server.setup_state = jobs[0].execution;
        return callback(null, server);
    });
}

function updateServersInfo(req, server, callback) {
    delete server.sysinfo;
    if (server.setup === false && server.setting_up) {
       getSetupStatus(req, server, function (err, updatedServer) {
            callback(null, updatedServer);
       });
    } else {
        callback(null, server);
    }
}

/**
 * Params
 * ===
 * params.uuid
 */
module.exports.get = function getServer(req, res, next) {
    req.sdc[req.dc].cnapi.getServer(
        req.params.uuid,
        {headers: getRequestHeaders(req)},
        function listServersCallback(err, obj, _req, _res) {
        if (err) {
            req.log.fatal(err, 'CNAPI Error retrieving server');
            return next(err, _res.httpCode);
        }

        getSetupStatus(req, obj, function (error, server) {
            res.send(server);
            return next();
        });
    });
};

module.exports.update = function updateServer(req, res, next) {
    req.sdc[req.dc].cnapi.updateServer(req.params.uuid, req.body,
        {headers: getRequestHeaders(req)},
        function (err, obj) {
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
    req.sdc[req.dc].cnapi.put({
        path: '/servers/' + req.params.uuid + '/factory-reset',
        headers: getRequestHeaders(req)
    },
    {},
    function (err, obj) {
        if (err) {
            req.log.error(err);
            return next(err);
        }

        res.send(obj);
        return next();
    });
};

module.exports.reboot = function reboot(req, res, next) {
    req.sdc[req.dc].cnapi.rebootServer(req.params.uuid,
        {headers: getRequestHeaders(req)},
     function (err, job) {
        if (err) {
            req.log.fatal(err, 'CNAPI: Failed to reboot server');
            return next(err);
        }

        res.send(job);
        return next();
    });
};

module.exports.setup = function setupServer(req, res, next) {
    var setupParams = {};
    if (req.body && req.body.hostname) {
        setupParams.hostname = req.body.hostname;
    }

    req.sdc[req.dc].cnapi.setupServer(
        req.params.uuid,
        setupParams,
        function setupServerCallback(err, obj, _req, _res) {
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
    req.sdc[req.dc].cnapi.del({
        path: '/servers/' + uuid,
        headers: getRequestHeaders(req)
    },
    function (err, obj) {
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

    Object.keys(params).forEach(function (key) {
        if (typeof (key) === 'string' && !params[key].length) {
            delete params[key];
        }
    });

    params.extras = 'memory';
    if (req.query.nictag && req.query.nictag.length) {
        params.extras = format('%s,sysinfo', params.extras);
    }

    req.log.info({query: params}, 'Listing servers');
    req.sdc[req.dc].cnapi.listServers(
        params,
        {headers: getRequestHeaders(req)},
        function (err, servers) {
        if (err) {
            req.log.error(err);
            return next(err);
        }

        if (req.query.hostname && req.query.hostname.length) {
            servers = _.filter(servers, function (s) {
                return s.hostname && s.hostname.toLowerCase().indexOf(req.query.hostname.toLowerCase()) !== -1;
            });
        }

        if (req.query.uuid) {
            servers = _.filter(servers, function (s) {
                return s.uuid.startsWith(req.query.uuid);
            });
        }

        if (req.query.traits) {
            servers = utils.filterTraits(req.query.traits, servers);
        }

        if (req.query.nictag) {
            servers = _.filter(servers, function (s) {
                if (!s.sysinfo) {
                    return false;
                }
                var tags = _.flatten(_.values(s.sysinfo['Network Interfaces']).map(function (n) {
                    return n['NIC Names'];
                }));
                return tags.indexOf(req.query.nictag) !== -1;
            });
        }

        // slim down response body
        async.map(servers, updateServersInfo.bind(null, req), function (error, updatedServers) {
            var sortField = req.query.sort;
            var direction = req.query.direction === 'desc' ? -1 : 1;
            var SORT_FIELDS = ['current_platform', 'boot_platform', 'hostname'];

            if (SORT_FIELDS.indexOf(sortField) !== -1) {
                updatedServers.sort(function (a, b) {
                    a = a[sortField];
                    b = b[sortField];
                    // handle sorting servers with one of the fields as null/undefined
                    if (typeof (a) !== 'string' && typeof (b) !== 'string') {
                        return 0;
                    } else if (typeof (a) !== 'string') {
                        return -direction;
                    } else if (typeof (b) !== 'string') {
                        return direction;
                    }

                    var acmp = a.toLowerCase();
                    var bcmp = b.toLowerCase();

                    return direction * (acmp === bcmp ? 0 : acmp < bcmp ? -1 : 1);
                });
            }

            if (sortField === 'provisionable_ram') {
                updatedServers.sort(function (a, b) {
                    a = parseInt(a.memory_provisionable_bytes, 10);
                    b = parseInt(b.memory_provisionable_bytes, 10);
                    if (isNaN(a) && isNaN(b)) {
                        return 0;
                    } else if (isNaN(a)) {
                        return -direction;
                    } else if (isNaN(b)) {
                        return direction;
                    } else {
                        return direction * (a === b ? 0 : a < b ? -1 : 1);
                    }
                });
            }

            res.cache('public', {maxAge: 60});
            res.send(updatedServers);
            return next();
        });
    });
};

module.exports.updateNics = function (req, res, next) {
    req.sdc[req.dc].cnapi.updateNics(
        req.params.uuid,
        req.body,
        {headers: getRequestHeaders(req)},
        function (err, obj) {
        if (err) {
            req.log.fatal(err, 'Error updating nics');
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};

module.exports.getBootParams = function (req, res, next) {
    var uuid = req.params.uuid;
    req.sdc[req.dc].cnapi.getBootParams(uuid, {
        headers: getRequestHeaders(req)
    }, function (err, obj) {
        if (err) {
            req.log.fatal(err, 'Error retrieving boot params');
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};

module.exports.setBootParams = function (req, res, next) {
    var uuid = req.params.uuid;
    req.sdc[req.dc].cnapi.put({
        path: format('/boot/%s', uuid),
        headers: getRequestHeaders(req)
    },
    req.body,
    function (err, obj) {

        if (err) {
            req.log.fatal(err, 'Error updating boot params');
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};
