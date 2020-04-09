/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 */

/* eslint-disable max-len */
var vasync = require('vasync');
var getRequestHeaders = require('./get-request-headers');


module.exports.list = function (req, res, next) {
    var params = req.params || {};
    var uuid = params.uuid;

    if (uuid) {
        delete params.uuid;
    }

    req.sdc[req.dc].napi.listNetworks(
        params,
        {headers: getRequestHeaders(req)},
        function (err, list) {
            if (err) {
                req.log.error(err);
                return next(err);
            }
            if (uuid && list.length) {
                list = list.filter(function (item) {
                    return item.uuid === uuid;
                });
            }
            res.send(list);
            return next();
        });
};

module.exports.deleteNetwork = function (req, res, next) {
    var uuid = req.params.uuid;
    var options = {headers: getRequestHeaders(req)};
    req.sdc[req.dc].napi.deleteNetwork(uuid, {}, options, function (err, obj) {
        if (err) {
            req.log.error(err, 'Error deleting network');
            return next(err);
        }

        res.send(obj);
        return next();
    });
};

module.exports.listNicTags = function (req, res, next) {
    req.sdc[req.dc].napi.listNicTags({}, {headers: getRequestHeaders(req)}, function (err, obj) {
        if (err) {
            req.log.error(err);
            return next(err);
        }
        res.send(obj);
        return next();
    });
};

module.exports.listServersWithNicTag = function (req, res, next) {
    var servers = [];
    vasync.waterfall([
        function getNics(cb) {
            req.sdc[req.dc].napi.listNics({
                belongs_to_type: 'server',
                nic_tag: req.params.uuid
            }, cb);
        },
        function mapNicsToUuids(nics, cb) {
            var uuids = nics.map(function (n) {
                return n.belongs_to_uuid;
            });
            cb(null, uuids);
        },
        function mapUuidsToServer(uuids, cb) {
            vasync.forEachParallel({
                inputs: uuids,
                func: function mapFn(uuid, callback) {
                    req.log.info('getting server info', uuid);
                    req.sdc[req.dc].cnapi.getServer(uuid, function (err, obj) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        servers.push(obj);
                        callback(null);
                    });
                }
            }, cb);
        }
    ], function done(err) {
        if (err) {
            res.send(err);
            next();
            return;
        }
        req.log.info(servers, 'got servers');
        res.send(servers);
        next();
    });
};

module.exports.getNicTag = function (req, res, next) {
    req.sdc[req.dc].napi.getNicTag(req.params.uuid, {headers: getRequestHeaders(req)}, function (err, obj) {
        if (err) {
            req.log.error(err);
            return next(err);
        }
        res.send(obj);
        return next();
    });
};

module.exports.createNicTag = function (req, res, next) {
    var params = {};
    var mtu = req.body.mtu;
    if (mtu) {
        params.mtu = mtu;
    }
    req.sdc[req.dc].napi.createNicTag(req.body.name, params, function (err, tag) {
        if (err) {
            req.log.error(err);
            return next(err);
        }
        res.send(tag);
        return next();
    });
};

module.exports.updateNicTag = function (req, res, next) {
    var params = {};
    var mtu = req.body.mtu;
    if (mtu) {
        params.mtu = mtu;
    }
    req.sdc[req.dc].napi.updateNicTag(
        req.body.name,
        params,
        function (err, tag) {
            if (err) {
                return next(err);
            }
            res.send(tag);
            return next();
    });
};

module.exports.deleteNicTag = function (req, res, next) {
    req.sdc[req.dc].napi.deleteNicTag(
        req.params.name,
        {},
        function (err, obj) {
            if (err) {
                req.log.error(err, 'Error deleting NIC tag');
                return next(err);
            }

            res.send(obj);
            return next();
    });
};

module.exports.get = function (req, res, next) {
    req.sdc[req.dc].napi.getNetwork(
        req.params.uuid,
        {headers: getRequestHeaders(req)},
        function getNetwork(err, obj) {
            if (err) {
                req.log.error(err);
                return next(err);
            }
            res.send(obj);
            return next();
    });
};

module.exports.update = function (req, res, next) {
    for (var p in req.body) {
        if (!req.body[p] || req.body[p].length === 0) {
            if (p !== 'owner_uuids') {
                delete req.body[p];
            }
        }
    }
    var options = {headers: getRequestHeaders(req)};
    req.sdc[req.dc].napi.listNicTags({}, options, function (err, nicTags) {
        var nicTagNames = nicTags.map(function (nt) {
            return nt.name;
        });

        if (req.body.nic_tag && (nicTagNames).indexOf(req.body.nic_tag) === -1) {
            req.sdc[req.dc].napi.createNicTag(req.body.nic_tag, function () {
                _updateNetwork();
            });
        } else {
            _updateNetwork();
        }
    });

    function _updateNetwork() {
        req.sdc[req.dc].napi.updateNetwork(req.params.uuid, req.body, options, function (err, obj) {
            if (err) {
                req.log.error(err);
                return next(err);
            }
            res.send(obj);
            return next();
        });
    }
};

module.exports.create = function (req, res, next) {
    var options = {headers: getRequestHeaders(req)};
    req.sdc[req.dc].napi.listNicTags({}, options, function (err, nicTags) {
        var nicTagNames = nicTags.map(function (nt) {
            return nt.name;
        });

        if (req.body.owner_uuids && req.body.owner_uuids.length === 0) {
            delete req.body.owner_uuids;
        }

        if (req.body.nic_tag && (nicTagNames).indexOf(req.body.nic_tag) === -1) {
            req.sdc[req.dc].napi.createNicTag(req.body.nic_tag, function () {
                _createNetwork();
            });
        } else {
            _createNetwork();
        }
    });

    function _createNetwork() {
        req.sdc[req.dc].napi.createNetwork(req.body, options, function (err, obj) {
            if (err) {
                req.log.error(err);
                return next(err);
            }
            res.send(obj);
            return next();
        });
    }
};

module.exports.listNics = function (req, res, next) {
    var params = req.params;

    req.sdc[req.dc].napi.listNics(params, {headers: getRequestHeaders(req)}, function (err, ips) {
        if (err) {
            req.log.error(err);
            return next(err);
        }
        res.send(ips);
        return next();
    });
};


module.exports.listIPs = function (req, res, next) {
    var networkid = req.params.uuid;
    var params = {
        limit: 1000,
        offset: 0
    };
    var options = {headers: getRequestHeaders(req)};
    var ips = [];
    var done = function () {
        res.send(ips);
        return next();
    };
    var getIps = function () {
        req.sdc[req.dc].napi.listIPs(networkid, params, options, function (err, list) {
            if (err) {
                req.log.error(err);
                next(err);
                return;
            }

            ips = ips ? ips.concat(list) : list;
            if (list.length === params.limit) {
                params.offset += params.limit;
                getIps();
            } else {
                done();
            }
        });
    };
    getIps();
};

module.exports.getIp = function (req, res, next) {
    var params = req.params;
    var options = {headers: getRequestHeaders(req)};
    req.sdc[req.dc].napi.getIP(params.uuid, params.ip, {}, options, function (err, ip) {
        if (err) {
            req.log.error(err);
            return next(err);
        }
        res.send(ip);
        return next();
    });
};

module.exports.updateIP = function (req, res, next) {
    var network = req.params.uuid;
    var ip = req.params.ip;
    var params = req.body;
    var options = {headers: getRequestHeaders(req)};

    req.sdc[req.dc].napi.updateIP(network, ip, params, options, function (err, o) {
        if (err) {
            req.log.error(err, 'Error updating IP');
            return next(err);
        }
        res.send(o);
        return next();
    });
};

module.exports.listAggregations = function listAggregations(req, res, next) {
    req.sdc[req.dc].napi.listAggrs(req.params, {headers: getRequestHeaders(req)}, listAggrsCb);

    function listAggrsCb(err, aggrs) {
        if (err) {
            req.log.error(err, 'Error Retrieving Link Aggregations');
            return next(err);
        }

        res.send(aggrs);
        return next();
    }
};


module.exports.createAggregation = function createAggregation(req, res, next) {
    req.sdc[req.dc].napi.createAggr(req.body, {headers: getRequestHeaders(req)}, cb);

    function cb(err, aggrs) {
        if (err) {
            req.log.error(err, 'Error Creating Link Aggregations');
            return next(err);
        }

        res.send(aggrs);
        return next();
    }
    return null;
};

module.exports.updateAggregation = function updateAggregation(req, res, next) {
    req.sdc[req.dc].napi.updateAggr(req.params.id, req.body, {headers: getRequestHeaders(req)}, cb);

    function cb(err, aggrs) {
        if (err) {
            req.log.error(err, 'Error Updating Link Aggregations');
            return next(err);
        }

        res.send(aggrs);
        return next();
    }
};


module.exports.deleteAggregation = function deleteAggregation(req, res, next) {
    req.sdc[req.dc].napi.deleteAggr(req.params.id, {headers: getRequestHeaders(req)}, cb);

    function cb(err, aggrs) {
        if (err) {
            req.log.error(err, 'Error Deleting Link Aggregations');
            return next(err);
        }

        res.send(aggrs);
        return next();
    }
};
