/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports.createNetworkPool = function (req, res, next) {
    var name = req.body.name;
    var body = {
        networks: req.body.networks
    };

    if (req.body.description && req.body.description.length) {
        body.description = req.body.description;
    }

    if (req.body.owner_uuids && req.body.owner_uuids.length) {
        body.owner_uuids = req.body.owner_uuids;
    }

    req.log.info(body, 'create network pool body params');
    req.sdc[req.dc].napi.createNetworkPool(name, body, function (err, job) {
        if (err) {
            req.log.fatal(err, 'Error deleting network pool');
            return next(err);
        } else {
            res.send(job);
            return next();
        }
    });
};

module.exports.listNetworkPools = function (req, res, next) {
    var params = req.params || {};

    req.sdc[req.dc].napi.listNetworkPools(params, function (err, networkPools) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(networkPools);
            return next();
        }
    });
};

module.exports.updateNetworkPool = function (req, res, next) {
    var uuid = req.params.uuid;
    var body = req.body || {};

    if (body.description.length === 0) {
        delete body.description;
    }

    req.sdc[req.dc].napi.updateNetworkPool(uuid, body, function (err, job) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(job);
            return next();
        }
    });
};

module.exports.getNetworkPool = function (req, res, next) {
    var uuid = req.params.uuid;

    req.sdc[req.dc].napi.getNetworkPool(uuid, function getNetworkPoolallback(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};

module.exports.deleteNetworkPool = function (req, res, next) {
    var uuid = req.params.uuid;

    req.sdc[req.dc].napi.deleteNetworkPool(uuid, function deleteNetworkPoolCallback(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(obj);
            return next();
        }
    });
};
