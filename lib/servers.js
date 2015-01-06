/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var format = require('sys').format;
var getRequestHeaders = require('./get-request-headers');

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

        res.send(obj);
        return next();
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
        path: '/servers/'+uuid,
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


        if (req.query.sort === 'current_platform' ||
            req.query.sort === 'boot_platform' ||
            req.query.sort === 'hostname') {

            var f = req.query.sort;
            servers.sort(function (a, b) {
                // handle sorting servers with one of the fields as null/undefined
                if (typeof a[f] !== 'string' && typeof (b[f]) !== 'string') {
                    return 0;
                } else if (typeof (a[f]) !== 'string') {
                    return -1;
                } else if (typeof (b[f]) !== 'string') {
                    return 1;
                }

                var acmp = a[f].toLowerCase();
                var bcmp = b[f].toLowerCase();

                if (acmp > bcmp) {
                    return 1;
                } else if (acmp < bcmp) {
                    return -1;
                } else {
                    return 0;
                }
            });
        }

        if (req.query.sort === 'provisionable_ram') {
            servers.sort(function (a, b) {
                return b.memory_provisionable_bytes - a.memory_provisionable_bytes;
            });
        }

        // slim down response body
        var result = servers.map(function (s) {
            delete s.sysinfo;
            return s;
        });
        res.cache('public', {maxAge: 60 });
        res.send(result);
        return next();
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
