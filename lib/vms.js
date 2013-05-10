var assert = require('assert');
var sprintf = require('util').format;
var restify = require('restify');

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
    req.sdc[req.dc].vmapi.createVm(req.body, function(err, obj) {
        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}

function list(req, res, next) {
    var params = req.params;
    var perPage = req.params.per_page || 1000;
    var page = req.params.page || 1;

    delete req.params.per_page;
    delete req.params.page;

    params.limit = perPage;
    params.offset = (page-1) * perPage;

    req.sdc[req.dc].vmapi.listVms(params, function listMachinesCb(err, vms, _req, _res) {
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

function get(req, res, next) {
    req.sdc[req.dc].vmapi.getVm({uuid: req.params.uuid}, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function del(req, res, next) {
    req.sdc[req.dc].vmapi.deleteVm({uuid:req.params.uuid}, function(err, obj) {
        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}


function update(req, res, next) {
    var updateAttrs = {};
    updateAttrs['uuid'] = req.params.uuid;

    if (req.body.tags) {
        updateAttrs['tags'] = req.body.tags;
    }

    if (req.body.alias) {
        updateAttrs['alias'] = req.body.alias;
    }

    req.log.info(updateAttrs, 'update');

    req.sdc[req.dc].vmapi.updateVm(updateAttrs, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function updateTags(req, res, next) {
    var params = req.body;
    params.uuid = req.params.uuid;

    req.sdc[req.dc].vmapi.setMetadata('tags', params, function(err, obj) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function updateCustomerMetadata(req, res, next) {
    var params = req.body;
    params.uuid = req.params.uuid;

    req.sdc[req.dc].vmapi.setMetadata('customer_metadata', params, function(err, obj) {
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
    body.uuid = req.params.uuid;

    fn.call(req.sdc[req.dc].vmapi, body, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}
