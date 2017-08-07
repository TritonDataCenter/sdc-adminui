/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2017, Joyent, Inc.
 */

var sprintf = require('util').format;
var restify = require('restify');
var errors = require('./errors');
var _ = require('underscore');
var getRequestHeaders = require('./get-request-headers');
var Promise = require('promise');
var utils = require('./utils');

var NOT_AVAILABLE = 'N/A';

module.exports = {
    create: create,
    list: list,
    get: get,
    update: update,
    action: action,
    del: del,
    updateTags: updateTags,
    updateCustomerMetadata: updateCustomerMetadata,
    groupedByCustomer: groupedByCustomer
};

var getVmsParams = function (params) {
    var query = params.query || [];

    if (params.uuid && params.uuid.length) {
        query.push(sprintf('(uuid=%s)', params.uuid));
    }

    if (params.server_uuid && params.server_uuid.length) {
        query.push(sprintf('(server_uuid=%s)', params.server_uuid));
        delete params.server_uuid;
    }

    if (params.alias && params.alias.length) {
        query.push(sprintf('(alias=*%s*)', params.alias));
        delete params.alias;
    }

    if (params.state && params.state.length) {
        if (params.state === 'active') {
            query.push(sprintf('(|(state=running)(state=stopped))'));
        } else {
            query.push(sprintf('(state=%s)', params.state));
        }
        delete params.state;
    }

    if (params.owner_uuid && params.owner_uuid.length) {
        query.push(sprintf('(owner_uuid=%s)', params.owner_uuid));
        delete params.owner_uuid;
    }

    if (params.billing_id && params.billing_id.length) {
        query.push(sprintf('(billing_id=%s)', params.billing_id));
        delete params.billing_id;
    }

    if (params.image_uuid && params.image_uuid.length) {
        query.push(sprintf('(image_uuid=%s)', params.image_uuid));
        delete params.image_uuid;
    }

    if (params.provisioned_from && params.provisioned_from.toString().match(/\d+/)) {
        query.push(sprintf('(create_timestamp>=%s)', params.provisioned_from));
        delete params.provisioned_from;
    }

    if (params.provisioned_to && params.provisioned_to.toString().match(/\d+/)) {
        query.push(sprintf('(create_timestamp<=%s)', params.provisioned_to));
        delete params.provisioned_to;
    }

    if (query.length) {
        query.reverse();
        params.query = '(&' + query.join('') + ')';
    }

    return params;
};

function create(req, res, next) {
    req.body.creator_uuid = req.session.data.user;
    req.body.origin = 'adminui';

    req.log.info(req.body, 'VMAPI Create Request');
    req.sdc[req.dc].vmapi.createVm(
        req.body,
        {headers: getRequestHeaders(req) },
        function (err, obj) {

        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}

var IPV4_REGEX =
    (/^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/);
var MAC_REGEX =
    (/^([0-9A-Fa-f]{2}:){5}([0-9A-Fa-f]{2})$/);
var UUID_REGEX =
    (/^[a-f0-9]{8}-([a-f0-9]{4}-){3}[a-f0-9]{12}$/);

function list(req, res, next) {
    var params = req.params;
    var ip = params.ip;
    var mac = params.mac;

    if (params.uuid) {
        if (!UUID_REGEX.test(params.uuid)) {
            return next(
                new errors.InvalidParameterError('Invalid UUID', [ {
                    field: 'uuid',
                    code: 'invalid',
                    message: sprintf('UUID %s is not a valid UUID', params.uuid)
                } ]));
        }
    }
    if (ip) {
        if (!IPV4_REGEX.test(ip)) {
            return next(
                new errors.InvalidParameterError('Invalid IP Address', [ {
                    field: 'ip',
                    code: 'invalid',
                    message: sprintf('IP address %s is not a valid IPv4 Address', ip)
                } ]));
        }
        return listVmsWithIP(ip);
    } else if (mac) {
        if (!MAC_REGEX.test(mac)) {
            return next(
                new errors.InvalidParameterError('Invalid MAC Address', [ {
                    field: 'mac',
                    code: 'invalid',
                    message: sprintf('MAC address %s is not a valid MAC-47 Address', mac)
                } ]));
        }
        return listVmsWithMAC(mac);
    } else {
        return listVms();
    }

    function listVmsWithIP(ipAddr) {
        var searchParams = {
            fabric: false
        };

        var done = function (err, ips) {
            req.log.info(ips);
            var matches = _.where(ips, {
                belongs_to_type: 'zone',
                ip: ip
            });
            if (matches.length === 0) {
                res.send([]);
                return next();
            }
            var uuids = _.pluck(matches, 'belongs_to_uuid');

            if (params.uuid) {
                var isUuidPresent = uuids.some(function (uuid) {
                    return uuid === params.uuid;
                });
                if (isUuidPresent && uuids.length === 1) {
                    delete params.uuid;
                } else {
                    res.send([]);
                    return next();
                }
            }

            var filter = uuids.map(function (uuid) {
                return sprintf('(uuid=%s)', uuid);
            });

            var query = filter.length > 1 ? [sprintf('(|%s)', filter.join(''))] : filter;
            req.log.debug('Listing VMs with IP addresses', {query: filter});

            params.query = query;
            delete params.ip;
            return listVms();
        };

        var searchIPs = function (options, callback) {
            req.sdc[req.dc].napi.searchIPs(
                ipAddr,
                options,
                {headers: getRequestHeaders(req)},
                callback);
        };

        searchIPs(searchParams, function (err, ips) {
            if (err && err.statusCode === 404) {
                searchParams.fabric = true;
                searchIPs(searchParams, done);
            } else {
                done(err, ips);
            }
        });
    }

    function listVmsWithMAC(macAddr) {
        req.sdc[req.dc].napi.getNic(macAddr, function (error, nic) {
            if (error) {
                return next(error);
            }
            var vmUuid = nic.belongs_to_type === 'zone' ? nic.belongs_to_uuid : '';
            if (vmUuid) {
                return req.sdc[req.dc].vmapi.getVm({uuid: vmUuid}, function (vmError, vm) {
                    if (vmError) {
                        return next(vmError);
                    }
                    res.send([vm]);
                    return next();
                });
            }
            res.send([]);
            return next();
        });
    }

    function listVms() {
        var perPage = req.params.perPage || 1000;
        var page = req.params.page || 1;
        params = getVmsParams(params);

        delete req.params.perPage;
        delete req.params.page;

        params.limit = perPage;
        params.offset = (page-1) * perPage;

        req.log.info(params, 'Listing VMS');
        req.sdc[req.dc].vmapi.listVms(
            params,
            {headers: getRequestHeaders(req)},
            function listMachinesCb(err, vms, _req, _res)
        {
            if (err) {
                req.log.error(err, 'Error retrieving Virtual Machines');
                return next(err);
            }
            var total = _res.headers['x-joyent-resource-count'];
            res.setHeader('x-object-count', total);
            vms = vms.map(function (vm) {
                delete vm.customer_metadata;
                delete vm.internal_metadata;
                return vm;
            });

            res.send(vms);
            return next();
        });
    }
}

function get(req, res, next) {
    var params = {
        uuid: req.params.uuid
    };
    if (req.params.hasOwnProperty('sync')) {
        try {
            params.sync = utils.boolFromString(req.params.sync, false, 'sync');
        } catch (boolErr) {
            next(new errors.InvalidParameterError(boolErr,
                boolErr.message, [ {
                    field: 'sync',
                    code: 'Invalid',
                    message: boolErr.message
                } ]));
            return;
        }
    }

    req.sdc[req.dc].vmapi.getVm(
        params,
        {headers: getRequestHeaders(req) },
        function (err, obj)
    {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function del(req, res, next) {
    var params = {
        creator_uuid: req.session.data.user,
        origin: 'adminui',
        uuid: req.params.uuid
    };

    req.log.info(params, 'VMAPI Delete Request');

    req.sdc[req.dc].vmapi.deleteVm(
        params,
        {headers: getRequestHeaders(req) },
        function (err, obj)
    {
        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}


function update(req, res, next) {
    var params = {};
    params.uuid = req.params.uuid;
    params.payload = req.body;

    if (req.body.firewall_enabled === 'true') {
        params.payload.firewall_enabled = true;
    } else if (req.body.firewall_enabled === 'false') {
        params.payload.firewall_enabled = false;
    }

    if (req.body.tags) {
        params.payload.tags = req.body.tags;
    }

    if (typeof (req.body.alias) === 'string')  {
        params.payload.alias = req.body.alias;
    }

    params.creator_uuid = req.session.data.user;
    params.origin = 'adminui';

    req.log.info(params, 'vm update request');

    req.sdc[req.dc].vmapi.updateVm(
        params,
        { headers: getRequestHeaders(req) },
        function (err, obj)
    {
        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}

function updateTags(req, res, next) {
    var params = {};
    params.uuid = req.params.uuid;
    params.metadata = req.body;
    function vmapiCallback(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        res.send(obj);
        return next();
    }
    if (Object.keys(params.metadata).length) {
        req.sdc[req.dc].vmapi.setMetadata('tags', params, { headers: getRequestHeaders(req) }, vmapiCallback);
    } else {
        req.sdc[req.dc].vmapi.deleteAllMetadata('tags', params, { headers: getRequestHeaders(req) }, vmapiCallback);
    }
}

function updateCustomerMetadata(req, res, next) {
    var params = {};
    params.uuid = req.params.uuid;
    params.metadata = req.body;

    req.sdc[req.dc].vmapi.setMetadata(
        'customer_metadata',
        params,
        {headers: getRequestHeaders(req) },
        function (err, obj)
    {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function action(req, res, next) {
    var actions = {
        start: req.sdc[req.dc].vmapi.startVm,
        stop: req.sdc[req.dc].vmapi.stopVm,
        reboot: req.sdc[req.dc].vmapi.rebootVm,
        create_snapshot: req.sdc[req.dc].vmapi.snapshotVm,
        rollback_snapshot: req.sdc[req.dc].vmapi.rollbackVm,
        delete_snapshot: req.sdc[req.dc].vmapi.deleteSnapshot,
        add_nics: req.sdc[req.dc].vmapi.addNics,
        update_nics: req.sdc[req.dc].vmapi.updateNics,
        remove_nics: req.sdc[req.dc].vmapi.removeNics,
        reprovision: req.sdc[req.dc].vmapi.reprovisionVm,
        update: req.sdc[req.dc].vmapi.updateVm
    };

    var fn = actions[req.params.action];
    var body;

    if (typeof (fn) === 'undefined') {
        return next(new restify.InvalidArgument('invalid action specified'));
    }
    if (req.params.action === 'update') {
        return update(req, res, next);
    }

    body = req.body || {};
    body.creator_uuid = req.session.data.user;
    body.origin = 'adminui';
    body.uuid = req.params.uuid;
    req.log.info(body, 'VMAPI Request ' + req.params.action);

    fn.call(
        req.sdc[req.dc].vmapi,
        body,
        {headers: getRequestHeaders(req) },
        function (err, obj)
    {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });

    return null;
}


function groupedByCustomer(req, res, next) {
    var _customers = {};
    var _vms;
    var params = getVmsParams(req.query);
    var perPage = params.perPage || 1000;
    var page = params.page || 1;

    delete params.perPage;
    delete params.page;

    params.limit = perPage * page;

    function _listVms() {
        return new Promise(function (resolve) {
            req.sdc[req.dc].vmapi.listVms(params, function (err, vms) {
                _vms = vms.map(function (vm) {
                    delete vm.customer_metadata;
                    delete vm.internal_metadata;
                    return vm;
                });
                resolve(vms);
            });
        });
    }

    function _fetchOwners() {
        var allOwners = _.pluck(_vms, 'owner_uuid');
        var owners = _.uniq(allOwners);
        var getUserCalls = owners.map(function (uuid) {
            return new Promise(function (resolve, reject) {
                req.ufds.getUser(uuid, function (err, owner) {
                    if (err) {
                        req.log.fatal(err, 'error retrieving owner for vms summary', owner);
                        if (err.restCode === 'ResourceNotFound') {
                            owner = {
                                cn: NOT_AVAILABLE,
                                uuid: uuid
                            };
                        } else {
                            next(err);
                            return;
                        }
                    }
                    if (owner.cn !== NOT_AVAILABLE) {
                        [
                            'controls',
                            'memberof',
                            'dn',
                            'pwdchangedtime',
                            'pwdendtime',
                            'registered_developer',
                            'approved_for_provisioning',
                            'memberof',
                            'objectclass'
                        ].forEach(function (key) {
                            delete owner[key];
                        });
                        owner.created_at = new Date(Number(owner.created_at));
                        owner.updated_at = new Date(Number(owner.updated_at));
                    }
                    _customers[uuid] = owner;
                    resolve(owner);
                    return;
                });
            });
        });

        return Promise.all(getUserCalls);
    }

    function _mergeData() {
        var values = [];
        var vmsGroupedByCustomerUuid = _.groupBy(_vms, function (vm) {
            return vm.owner_uuid;
        });

        for (var customerUuid in _customers) {
            var row = _customers[customerUuid];
            row.vms = vmsGroupedByCustomerUuid[customerUuid];
            values.push(row);
        }
        return values;
    }

    _listVms().then(_fetchOwners).then(_mergeData).then(function (data) {
        res.send(data);
    });
}
