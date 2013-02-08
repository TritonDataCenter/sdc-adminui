var assert = require('assert');
var sprintf = require('util').format;

module.exports = {
    create: create,
    list: list,
    get: get,
    update: update,
    action: action,
    del: del,
    count: count,
    listJobs: listJobs,
    getJob: getJob,
    updateTags: updateTags,
    updateCustomerMetadata: updateCustomerMetadata
};

function listJobs(req, res, next) {
    req.sdc[req.dc].vmapi.get('/jobs', function(err, jobs) {
        if (err) {
            return next(err);
        } else {
            res.send(jobs);
            return next();
        }
    });
}

function getJob(req, res, next) {
    assert.ok(req.params.uuid);

    var jobUuid = req.params.uuid;

    req.sdc[req.dc].vmapi.get(
        sprintf('/jobs/%s', jobUuid),
        function(err, obj) {
            if (err) {
                return next(err);
            }

            res.send(obj);
            return next();
        }
    );
}



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
    req.sdc[req.dc].vmapi.listVms(req.params, function listMachinesCb(err, obj, _req, _res) {
        if (err) {
            return next(err);
        }

        res.send(obj);
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

function count(req, res, next) {
    req.sdc[req.dc].vmapi.get('/vms?limit=0', function(err, obj, vmReq, vmRes) {
        var c = vmRes.headers['x-joyent-resource-count'];
        res.send({ total: c });
        return next();
    });
}

function action(req, res, next) {
    var actions = {
        start: req.sdc[req.dc].vmapi.startVm,
        stop: req.sdc[req.dc].vmapi.stopVm,
        reboot: req.sdc[req.dc].vmapi.rebootVm,
        create_snapshot: req.sdc[req.dc].vmapi.snapshotVm,
        add_nics: req.sdc[req.dc].vmapi.addNics,
        remove_nics: req.sdc[req.dc].vmapi.removeNics
    };

    var action = actions[req.params.action];

    if (typeof(action) === 'undefined') {
       return next(new restify.InvalidArgument('invalid action specified'));
    }

    var body = req.body || {};
    body.uuid = req.params.uuid;

    action.call(req.sdc[req.dc].vmapi, body, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}
