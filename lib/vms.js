var assert = require('assert');
var sprintf = require('util').format;
var restify = require('restify');
var errors = require('./errors');
var _ = require('underscore');
var getRequestHeaders = require('./get-request-headers');

module.exports = {
    create: create,
    list: list,
    get: get,
    update: update,
    action: action,
    del: del,
    updateTags: updateTags,
    updateCustomerMetadata: updateCustomerMetadata
};


function create(req, res, next) {

    req.body.creator_uuid = req.session.data.uuid;
    req.body.origin = 'adminui';

    req.log.info(req.body, 'VMAPI Create Request');
    req.sdc[req.dc].vmapi.createVm(
        req.body,
        {headers: getRequestHeaders(req) },
        function(err, obj) {

        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}

var IPV4_REGEX = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;

function list(req, res, next) {
    if (req.query.ip) {
        var ip = req.query.ip;
        if (false === IPV4_REGEX.test(ip)) {
            return next(new errors.InvalidParameterError('Invalid IP Address', [{
                field: 'ip',
                code: 'invalid',
                message: sprintf('IP address %s is not a valid IPv4 Address', ip)
            }]));
        }
        listVmsWithIP(ip);
    } else {
        listVms();
    }

    function listVmsWithIP(ip) {
        req.sdc[req.dc].napi.searchIPs(
            ip,
            {},
            {headers: getRequestHeaders(req) },
            function(err, ips)
        {
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
            var filter = uuids.map(function(u) {
                return sprintf('(uuid=%s)', u);
            });
            if (filter.length > 1) {
                filter = sprintf('(|%s)', filter);
            }

            req.sdc[req.dc].vmapi.listVms(
                {query: filter},
                {headers: getRequestHeaders(req) },
                function(err, vms)
            {
                if (err) {
                    return next(err);
                } else {
                    res.send(vms);
                    return next();
                }
            });
        });
    }

    function listVms() {
        var params = req.params;
        var perPage = req.params.perPage || 1000;
        var page = req.params.page || 1;

        if (params.alias && params.alias.length) {
            params.alias = '*'+params.alias+'*';
        }

        delete req.params.perPage;
        delete req.params.page;

        params.limit = perPage;
        params.offset = (page-1) * perPage;

        req.sdc[req.dc].vmapi.listVms(
            params,
            {headers: getRequestHeaders(req) },
            function listMachinesCb(err, vms, _req, _res)
        {
            if (err) {
                req.log.error(err, 'Error retrieving Virtual Machines');
                return next(err);
            }
            var total = _res.headers['x-joyent-resource-count'];
            res.setHeader('x-object-count', total);
            vms = vms.map(function(vm) {
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
    req.sdc[req.dc].vmapi.getVm(
        {uuid: req.params.uuid},
        {headers: getRequestHeaders(req) },
        function(err, obj)
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
        creator_uuid: req.session.data.uuid,
        origin: 'adminui',
        uuid: req.params.uuid
    };

    req.log.info(params, 'VMAPI Delete Request');

    req.sdc[req.dc].vmapi.deleteVm(
        params,
        {headers: getRequestHeaders(req) },
        function(err, obj)
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
    params.payload = {};

    if (req.body.tags) {
        params.payload.tags = req.body.tags;
    }

    if (typeof(req.body.alias) === 'string')  {
        params.payload.alias = req.body.alias;
    }

    params.creator_uuid = req.session.data.uuid;
    params.origin = 'adminui';

    req.log.info(params, 'vm update request');

    req.sdc[req.dc].vmapi.updateVm(
        params,
        { headers: getRequestHeaders(req) },
        function(err, obj)
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

    req.sdc[req.dc].vmapi.setMetadata(
        'tags',
        params,
        { headers: getRequestHeaders(req) },
        function(err, obj)
    {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function updateCustomerMetadata(req, res, next) {
    var params = {};
    params.uuid = req.params.uuid;
    params.metadata = req.body;

    req.sdc[req.dc].vmapi.setMetadata(
        'customer_metadata',
        params,
        {headers: getRequestHeaders(req) },
        function(err, obj)
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
        add_nics: req.sdc[req.dc].vmapi.addNics,
        remove_nics: req.sdc[req.dc].vmapi.removeNics,
        update: req.sdc[req.dc].vmapi.updateVm
    };

    var fn = actions[req.params.action];

    if (typeof(fn) === 'undefined') {
        return next(new restify.InvalidArgument('invalid action specified'));
    }

    var body = req.body || {};
    body.creator_uuid = req.session.data.uuid;
    body.origin = 'adminui';
    body.uuid = req.params.uuid;
    req.log.info(body, "VMAPI Request " + req.params.action);

    fn.call(
        req.sdc[req.dc].vmapi,
        body,
        {headers: getRequestHeaders(req) },
        function(err, obj)
    {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}
