var assert = require('assert');
var sprintf = require('util').format;

module.exports = {
  create: create,
  list: list,
  get: get,
  action: action,
  delete: del,
  getJob: getJob
}

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
    }
  );
}



function create(req, res, next) {
  req.sdc['coal'].vmapi.createVm(req.params, function(err, obj) {
    if (err) {
      return next(err);
    }

    res.send(obj);
  });
}

function list(req, res, next) {
  req.sdc['coal'].vmapi.listVms(req.params, function listMachinesCb(err, obj, _req, _res) {
    if (err) {
      return next(err);
    }

    return res.send(obj);
  });
};

function get(req, res, next) {
  req.sdc['coal'].vmapi.getVm({uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return next(err);
    }
    return res.send(obj);
  });
};

function del(req, res, next) {
  req.sdc['coal'].vmapi.deleteVm({uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return next(err);
    }
    return res.send(obj);
  });
};

function action(req, res, next) {
  var actions = {
    'start': req.sdc['coal'].vmapi.startVm,
    'stop': req.sdc['coal'].vmapi.stopVm,
    'reboot': req.sdc['coal'].vmapi.rebootVm
  }

  var action = actions[req.params.action];
  action.call(req.sdc['coal'].vmapi, {uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return next(err);
    }
    return res.send(obj);
  });
};
