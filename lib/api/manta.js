var SDC_CLIENTS = require('sdc-clients');

var kang = require('kang');
var _ = require('underscore');
var Promise = require('promise');

var _lastHosts;
var _lastHostsTime;

function getMarlinAgentSources(req) {
    var sapi = req.sdc[req.dc].sapi;
    var vmapi = req.sdc[req.dc].vmapi;
    var cnapi = req.sdc[req.dc].cnapi;

    // list applications?name=manta
    var getMantaApplication = function() {
        return new Promise(function(resolve, reject) {
            sapi.listApplications({'name': 'manta'}, function(err, app) {
                if (err) {
                    reject(err);
                } else {
                    req.log.debug('got manta application', app.uuid);
                    resolve(app[0].uuid);
                }
            });
        });
    };

    // list instances?uuid=<manta_instance_id>
    var listMantaInstances = function(uuid) {
        req.log.debug('getting Manta Instances', uuid);
        return new Promise(function(resolve, reject) {
            sapi.getApplicationObjects(uuid, function(err, obj) {
                if (err) {
                    reject(err);
                } else {
                    var instances = [];
                    var services = _.keys(obj.services);
                    _.each(services, function(s) {
                        _.each(obj.instances[s], function(i) {
                            instances.push(i.uuid);
                        });
                    });

                    req.log.debug('got manta instances from sapi', instances.length);
                    resolve(instances);
                }
            });
        });
    };

    var getServerUuidsForVms = function(vmUuids) {
        req.log.debug(vmUuids, 'retrieving vms');
        var tasks = vmUuids.map(function(vmUuid) {
            return new Promise(function(resolve, reject) {
                vmapi.getVm({uuid: vmUuid}, function(err, vm) {
                    if (err) {
                        req.log.error(err, 'error retrieving vm');
                        reject(err);
                    } else {
                        resolve(vm.server_uuid);
                    }
                });
            });
        });

        return Promise.all(tasks);
    };

    var getServerForServerUuids = function(serverUuids) {
        var uniqueServers = _.unique(serverUuids);
        req.log.info('got server uuids with agents', uniqueServers.length);

        var tasks = uniqueServers.map(function(uuid) {
            return new Promise(function(resolve, reject) {
                cnapi.getServer(uuid, function(err, server) {
                    if (err) {
                        req.log.error(err);
                        reject(err);
                    } else {
                        req.log.info(server);
                        resolve(server);
                    }
                });
            });
        });

        return Promise.all(tasks);
    };

    if (_lastHosts && Date.now() - _lastHostsTime < 15*60*1000) {
        return Promise.resolve(_lastHosts);
    } else {
        return getMantaApplication()
            .then(listMantaInstances)
            .then(getServerUuidsForVms)
            .then(getServerForServerUuids)
            .then(function(servers) {
                return new Promise(function(revolve, reject) {
                    req.log.info('got servers with manta agents', servers.length);
                    var ips = servers.map(function(sv) {
                        var ip;
                        _.each(sv.sysinfo['Network Interfaces'], function(nic, n) {
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

            });
    }
}



var _pendingResponses = [];
var _lastSnapshot;
var _lastSnapshotTime;

function getMarlinAgentsSnapshot(req, res, next) {
    if (_lastSnapshot !== undefined && Date.now() - _lastSnapshotTime < 1000) {
        res.send(_lastSnapshot);
        return next();
    }

    _pendingResponses.push(res);

    getMarlinAgentSources(req).then(function(sources) {
        sources = sources.map(function(s) {
            s = s + ':9080';
            return kang.knMakeSource(s);
        });

        req.log.debug(sources, 'got sources for agentsDashboard');

        kang.knFetchAll({
            sources: sources,
            clientOptions: { connectTimeout: 5000 }
        }, function(err, snapshot) {
            if (err) {
                req.log.error(err, 'error fetching snapshot from source');
                _pendingResponses.forEach(function(response) {
                    response.send(err);
                });
            } else {
                _pendingResponses.forEach(function(response) {
                    response.send(snapshot);
                });
            }

            _lastSnapshot = snapshot;
            _pendingResponses = [];
            _lastSnapshotTime = Date.now();
        });
    }, function(err) {
        req.log.fatal(err, 'error fetching marlin hosts');
        return next(err);
    });
}




module.exports = {
    mount: function(app, pre) {
        app.get(
            { path: '/api/manta/agents', name: 'GetMarlinAgentsSnapshot'},
            pre, getMarlinAgentsSnapshot
        );
    }
};
