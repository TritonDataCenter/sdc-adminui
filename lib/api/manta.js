/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var kang = require('kang');
var _ = require('underscore');
var Promise = require('promise');

var sapi;
var vmapi;
var cnapi;
var log;



// --- Sub functions

// list applications?name=manta
var getMantaApplication = function () {
    return new Promise(function (resolve, reject) {
        sapi.listApplications({'name': 'manta'}, function (err, app) {
            if (err) {
                reject(err);
            } else {
                log.debug('got manta application', app.uuid);
                resolve(app[0].uuid);
            }
        });
    });
};

// list instances?uuid=<manta_instance_id>
var listMantaInstances = function (uuid) {
    log.debug('getting Manta Instances', uuid);
    return new Promise(function (resolve, reject) {
        sapi.getApplicationObjects(uuid, function (err, obj) {
            if (err) {
                reject(err);
            } else {
                var instances = [];
                var services = _.keys(obj.services);
                _.each(services, function (s) {
                    _.each(obj.instances[s], function (i) {
                        instances.push(i.uuid);
                    });
                });

                log.debug('got manta instances from sapi', instances.length);
                resolve(instances);
            }
        });
    });
};

var getServerUuidsForVms = function (vmUuids) {
    log.debug(vmUuids, 'retrieving vms');
    var tasks = vmUuids.map(function (vmUuid) {
        return new Promise(function (resolve, reject) {
            vmapi.getVm({uuid: vmUuid}, function (err, vm) {
                if (err) {
                    log.error(err, 'error retrieving vm');
                    reject(err);
                } else {
                    resolve(vm.server_uuid);
                }
            });
        });
    });

    return Promise.all(tasks);
};

var getServerForServerUuids = function (serverUuids) {
    var uniqueServers = _.unique(serverUuids);
    log.info('got server uuids with agents', uniqueServers.length);

    var tasks = uniqueServers.map(function (uuid) {
        return new Promise(function (resolve, reject) {
            cnapi.getServer(uuid, function (err, server) {
                if (err) {
                    log.error(err);
                    reject(err);
                } else {
                    log.info(server);
                    resolve(server);
                }
            });
        });
    });

    return Promise.all(tasks);
};

var getMantaNicIpsFromServers = function (servers) {
    return new Promise(function (revolve, reject) {
        log.info('got servers with manta agents', servers.length);
        var ips = servers.map(function (sv) {
            var ip;
            _.each(sv.sysinfo['Network Interfaces'], function (nic, n) {
                if (nic['NIC Names'].indexOf('admin') !== -1) {
                    ip = nic.ip4addr;
                }
            });
            return ip;
        });

        revolve(ips);
        _lastHosts = ips;
        _lastHostsTime = Date.now();
    });
};






var _lastHosts;
var _lastHostsTime;

var _pendingResponses = [];
var _lastSnapshot;
var _lastSnapshotTime;

// only refetch hosts every 15 minutes
function getHosts() {
    if (_lastHosts && Date.now() - _lastHostsTime < 15*60*1000) {
        return Promise.resolve(_lastHosts);
    } else {
        return getMantaApplication()
            .then(function (app) {
                return listMantaInstances(app);
            })
             .then(function (instances) {
                return getServerUuidsForVms(instances);
            })
             .then(function (serverUuids) {
                return getServerForServerUuids(serverUuids);
            })
             .then(function (servers) {
                return getMantaNicIpsFromServers(servers);
            });
    }
}




var fetchSources = function (ips) {
    return new Promise(function (resolve, reject) {
        var sources = ips.map(function (s) {
            s = s + ':9080';
            return kang.knMakeSource(s);
        });

        log.debug(sources, 'got sources for agentsDashboard');

        kang.knFetchAll({
            sources: sources,
            clientOptions: { connectTimeout: 5000 }
        }, function (err, snapshot) {
            if (err) {
                reject(err);
                log.error(err, 'error fetching snapshot from source');
            } else {
                resolve(snapshot);
            }
        });
    });
};






// --- API handler

function getMarlinAgentsSnapshot(req, res, next) {
    log = req.log;
    sapi = req.sdc[req.dc].sapi;
    vmapi = req.sdc[req.dc].vmapi;
    cnapi = req.sdc[req.dc].cnapi;

    if (_lastSnapshot !== undefined && Date.now() - _lastSnapshotTime < 1000) {
        res.send(_lastSnapshot);
        return next();
    }

    _pendingResponses.push(res);

    getHosts().then(function (ips) {
        return fetchSources(ips);
    })
    .then(function respond(snapshot) {
        _pendingResponses.forEach(function (response) {
            response.send(snapshot);
        });

        _lastSnapshot = snapshot;
        _pendingResponses = [];
        _lastSnapshotTime = Date.now();
    }, function (err) {
        req.log.fatal(err, 'error fetching marlin hosts');
        _pendingResponses.forEach(function (response) {
            response.send(err);
        });
    });

    return null;
}




module.exports = {
    mount: function (app, pre) {
        app.get(
            { path: '/api/manta/agents', name: 'GetMarlinAgentsSnapshot'},
            pre, getMarlinAgentsSnapshot);
    }
};
