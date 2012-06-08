var assert = require('assert');
var sprintf = require('util').format;
module.exports = {
  create: create,
  list: list,
  get: get,
  reboot: reboot,
  start: start,
  getJob: getJob
}

function getJob(req, res, next) {
  assert.ok(req.params.jobUuid);

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
  req.sdc['coal'].vmapi.listVms(function listMachinesCb(err, obj, _req, _res) {
    if (err) {
      return next(err);
    }

    return res.send(obj);
  });
};

function get(req, res, next) {
  req.sdc['coal'].vmapi.getVm({uuid:req.params.uuid}, function(err, obj) {
    return res.send(obj);
  });
};

function reboot(req, res, next) {
  req.sdc['coal'].vmapi.rebootVm({uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return res.send(err);
    }
    return res.send(obj);
  });
};

function start(req, res, next) {
  req.sdc['coal'].vmapi.startVm({uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return res.send(err);
    }
    return res.send(obj);
  });
};
