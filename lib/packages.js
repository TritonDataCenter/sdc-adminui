/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var sprintf = require('util').format;
var utils = require('./utils');

module.exports = {};

module.exports.add = function (req, res, next) {
    var params = req.body;
    var pkgclient = req.sdc[req.dc].papi;

    if (!params.owner_uuid || params.owner_uuid.length === 0) {
        delete params.owner_uuid;
    }

    if (!params.vcpus || params.vcpus.length === 0 || params.vcpus === 0) {
        delete params.vcpus;
    }

    req.log.info(params, 'papi.add');

    pkgclient.add(params, {headers: {'x-request-id': req.getId()}}, function (err, pkg) {
        if (err) {
            req.log.fatal(err, 'Error adding package', params);
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};



module.exports.del = function (req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;
    pkgclient.del(req.params.uuid, {headers: {'x-request-id': req.getId()}}, function (err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};


module.exports.get = function (req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;
    pkgclient.get(req.params.uuid, {headers: {'x-request-id': req.getId()}}, function (err, pkg) {
        if (err) {
            return next(err);
        } else {
            res.send(pkg);
            return next();
        }
    });
};


module.exports.update = function (req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;

    pkgclient.get(req.params.uuid, {headers: {'x-request-id': req.getId()}}, function (err, pkg) {
        if (err) {
            req.log.fatal(err, 'Error retrieving package info', req.params.uuid);
            return next(err);
        }

        var changes = req.body;
        for (var k in req.body) {
            if (typeof (changes[k]) === 'string' && changes[k].length === 0) {
                delete changes[k];
            }
        }


        if (!changes.owner_uuid || changes.owner_uuid.length === 0) {
            delete changes.owner_uuid;
        }


        req.log.info('sdc-clients.package.update',
            {uuid: req.params.uuid, changes: changes});

        pkgclient.update(pkg.uuid, changes, {headers: {'x-request-id': req.getId()}}, function (updateErr) {
            if (updateErr) {
                req.log.fatal(updateErr, 'Error updating package', pkg.uuid, changes);
                return next(updateErr);
            }
            done();
        });
    });

    function done() {
        module.exports.get(req, res, next);
    }
};

module.exports.list = function (req, res, next) {
    var pkgclient = req.sdc[req.dc].papi;

    req.log.info(req.query, 'pkg.list');

    var query = req.query;
    var filter = [];

    var uuids = query.uuids;
    var ldapFilter;

    if (uuids) {
        filter = {uuid: uuids};
    } else {
        _.each(query, function (value, key) {
            if (key === 'group' || key === 'traits') {
                return;
            }
            if (typeof (value) === 'string' && value.length) {
                if (key === 'uuid' || value === 'true' || value === 'false') {
                    filter.push(sprintf('(%s=%s)', key, value));
                } else {
                    filter.push(sprintf('(%s:caseIgnoreSubstringsMatch:=*%s*)', key, value));
                }
                return;
            }
            if (typeof (value) === 'object') {
                if (key === 'owner_uuids') {
                    filter.push(sprintf('(%s=%s)', key, value[0]));
                    return;
                }
                Object.keys(value).forEach(function (op) {
                    filter.push(sprintf('(%s%s%s)', key, op, value[op]));
                });
                return;
            }
        });
        ldapFilter = filter.length ? sprintf('(&%s)', filter.join('')) : '';
    }

    var opts = {
        sort: 'name',
        headers: {'x-request-id': req.getId()}
    };

    req.log.info(ldapFilter, opts, 'pkg.list params');

    pkgclient.list(ldapFilter || filter, opts, function (err, packages) {
        if (err) {
            return next(err);
        }
        if (req.query.group) {
            packages = packages.filter(function (p) {
                return p.group === req.query.group;
            });
        }
        if (req.query.traits) {
            packages = utils.filterTraits(req.query.traits, packages);
        }

        res.send(packages);
        return next();
    });
};
