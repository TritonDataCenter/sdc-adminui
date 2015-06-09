/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

function getOwner(req, params) {
    params = params || 'params';
    req[params] = req[params] || {};
    var owner_uuid = req[params].owner_uuid;
    var sessionData = req.session.data;
    return owner_uuid && owner_uuid !== 'null' &&
        sessionData.roles.indexOf('operators') !== -1 ? owner_uuid : sessionData.user;
}

function getId(params) {
    var id = parseInt(params.id, 10);
    return isNaN(id) ? 0 : id;
}

var commonCallback = function (err, data, res, next) {
    if (err) {
        res.req.log.error(err);
        return next(err);
    }
    res.send(data);
    return next();
};

module.exports.createFabricVlan = function (req, res, next) {
    var owner = getOwner(req, 'body');
    var body = req.body;
    body.vlan_id = body.vlan_id || 0;

    req.sdc[req.dc].napi.createFabricVLAN(owner, body, function (err, vlan) {
        return commonCallback(err, vlan, res, next);
    });
};

module.exports.listFabricVlans = function (req, res, next) {
    var owner = getOwner(req);

    req.sdc[req.dc].napi.listFabricVLANs(owner, req.params, function (err, vlans) {
        return commonCallback(err, vlans, res, next);
    });
};

module.exports.updateFabricVlan = function (req, res, next) {
    var owner = getOwner(req);
    var id = getId(req.params);

    req.sdc[req.dc].napi.updateFabricVLAN(owner, id, req.body, function (err, vlan) {
        return commonCallback(err, vlan, res, next);
    });
};

module.exports.getFabricVlan = function (req, res, next) {
    var owner = getOwner(req);
    var id = getId(req.params);

    req.sdc[req.dc].napi.getFabricVLAN(owner, id, {}, function (err, vlan) {
        return commonCallback(err, vlan, res, next);
    });
};

module.exports.deleteFabricVlan = function (req, res, next) {
    var owner = getOwner(req, 'body');
    var id = getId(req.params);

    req.sdc[req.dc].napi.deleteFabricVLAN(owner, id, req.body, function (err, data) {
        return commonCallback(err, data, res, next);
    });
};

module.exports.listFabricNetworks = function (req, res, next) {
    var owner = getOwner(req);
    var id = getId(req.params);

    req.sdc[req.dc].napi.listFabricNetworks(owner, id, req.params, function (err, networks) {
        return commonCallback(err, networks, res, next);
    });
};

module.exports.createFabricNetwork = function (req, res, next) {
    var owner = getOwner(req);
    var id = getId(req.params);

    req.sdc[req.dc].napi.createFabricNetwork(owner, id, req.body, function (err, network) {
        return commonCallback(err, network, res, next);
    });
};

module.exports.getFabricNetwork = function (req, res, next) {
    var owner = getOwner(req);
    var id = getId(req.params);

    req.sdc[req.dc].napi.getFabricNetwork(owner, id, req.params.uuid, req.params, function (err, network) {
        return commonCallback(err, network, res, next);
    });
};

module.exports.deleteFabricNetwork = function (req, res, next) {
    var owner = getOwner(req);
    var id = getId(req.params);

    req.sdc[req.dc].napi.deleteFabricNetwork(owner, id, req.params.uuid, req.params, function (err, data) {
        return commonCallback(err, data, res, next);
    });
};
