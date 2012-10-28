var assert = require('assert');
var sprintf = require('util').format;

module.exports = {
    create: create,
    list: list,
    get: get,
    update: update,
    action: action,
    del: del,
    getJob: getJob,
    updateTags: updateTags,
    updateCustomerMetadata: updateCustomerMetadata
};

function getJob(req, res, next) {
    assert.ok(req.params.uuid);

    var jobUuid = req.params.uuid;

    req.sdc['coal'].vmapi.get(
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
    req.sdc['coal'].vmapi.createVm(req.params, function(err, obj) {
    if (err) {
      return next(err);
  }

  res.send(obj);
  return next();
});
}

function list(req, res, next) {
    req.sdc['coal'].vmapi.listVms(req.params, function listMachinesCb(err, obj, _req, _res) {
        if (err) {
            return next(err);
        }

        res.send(obj);
        return next();
    });
}

function get(req, res, next) {
    req.sdc['coal'].vmapi.getVm({uuid:req.params.uuid}, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function del(req, res, next) {
    req.sdc['coal'].vmapi.deleteVm({uuid:req.params.uuid}, function(err, obj) {
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

    if (req.params.tags) {
        updateAttrs['tags'] = req.params.tags;
    }
    if (req.params.alias) {
        updateAttrs['alias'] = req.params.alias;
    }
    req.sdc['coal'].vmapi.updateVm(updateAttrs, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}

function updateTags(req, res, next) {
    var params = req.params;
    params.uuid = req.params.uuid;

    req.sdc['coal'].vmapi.setMetadata('tags', params, function(err, obj) {
        if (err) {
        return next(err);
        }
        res.send(obj);
        return next();
    });
}

function updateCustomerMetadata(req, res, next) {
    var params = req.params;
    params.uuid = req.params.uuid;

    req.sdc['coal'].vmapi.setMetadata('customer_metadata', params, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}


function action(req, res, next) {
    var actions = {
        start: req.sdc['coal'].vmapi.startVm,
        stop: req.sdc['coal'].vmapi.stopVm,
        reboot: req.sdc['coal'].vmapi.rebootVm
    };

    var action = actions[req.params.action];
    action.call(req.sdc['coal'].vmapi, {uuid:req.params.uuid}, function(err, obj) {
        if (err) {
            return next(err);
        }
        res.send(obj);
        return next();
    });
}
