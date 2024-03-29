/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 * Copyright 2023 MNX Cloud, Inc.
 */

/* eslint-disable max-len */

var _ = require('underscore');
var format = require('util').format;
var getRequestHeaders = require('./get-request-headers');
var utils = require('./utils');
var vasync = require('vasync');
var sprintf = require('util').format;
var querystring = require('querystring');

function getSetupStatus(req, server, callback) {
    server.setup_state = server.setup ? 'succeeded' : 'running';
    if (server.setup) {
        callback(null, server);
        return;
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
        server.setup_state = jobs.length ? jobs[0].execution : 'new';
        return callback(null, server);
    });
}

/*
 * The `system_type` attribute on servers (from sysinfo) differs from
 * the `os`` property returned from the /platform CNAPI endpoint. Add a
 * property that matches what `/platform?os=true` returns.
 */
function getPlatformOS(systemType) {
    var systemTypes = {
        SunOS: 'smartos',
        Linux: 'linux'
    };
    return systemTypes[systemType] || 'smartos';
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
            next(err, _res.httpCode);
            return;
        }

        obj.current_platform_os = getPlatformOS(obj.system_type);

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
    if (req.body) {
        if (req.body.hostname) {
            setupParams.hostname = req.body.hostname;
        }
        if (req.body.encryption_enabled === 'true') {
            setupParams.encryption_enabled = 'true';
        }
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
    var query = req.query;

    var params = {
        extras: 'memory'
    };
    if (query.nictag && query.nictag.length) {
        params.extras = format('%s,sysinfo', params.extras);
    }

    req.sdc[req.dc].cnapi.listServers(
        params,
        {headers: getRequestHeaders(req)},
        function (err, servers) {
        if (err) {
            req.log.error(err);
            next(err);
            return;
        }

        Object.keys(query).forEach(function (key) {
            var value = query[key];
            if (value) {
                var filter;
                switch (key) {
                    case 'uuid':
                        filter = function (server) {
                            return server[key].startsWith(value);
                        };
                        break;
                    case 'hostname':
                        filter = function (server) {
                            var hostname = server[key];
                            return hostname && hostname.toLowerCase().indexOf(value.toLowerCase()) !== -1;
                        };
                        break;
                    case 'reserved':
                    case 'setup':
                        filter = function (server) {
                            return server[key] === (value === 'true');
                        };
                        break;
                    case 'nictag':
                        filter = function (server) {
                            var nics = server.sysinfo ? server.sysinfo['Network Interfaces'] : [];
                            var tags = _.flatten(_.values(nics).map(function (nic) {
                                return nic['NIC Names'];
                            }));
                            return tags.indexOf(value) !== -1;
                        };
                        break;
                    default:
                        filter = function () { return true; };
                        break;
                }
                servers = _.filter(servers, filter);
                if (key === 'traits') {
                    servers = utils.filterTraits(value, servers);
                }
            }
        });

        var updatedServers = [];
        // slim down response body
        vasync.forEachParallel({
            inputs: servers,
            func: function updateServersInfo(server, callback) {
                delete server.sysinfo;
                if (server.setup === false && server.setting_up) {
                    getSetupStatus(req, server, function (upErr, updatedServer) {
                        if (upErr) {
                            callback(upErr);
                            return;
                        }
                        updatedServers.push(updatedServer);
                        callback();
                    });
                } else {
                    updatedServers.push(server);
                    callback();
                }
            }
        }, function paraCb(error, _results) {
            if (error) {
                req.log.error(error);
                next(error);
                return;
            }
            var sortField = query.sort;
            var direction = query.direction === 'desc' ? -1 : 1;
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
            next();
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
