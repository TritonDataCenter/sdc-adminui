var assert = require('assert');

module.exports.list = function(req, res, next) {

  req.sdc['coal'].zapi.listVms(function listMachinesCb(err, obj, _req, _res) {
    if (err) {
      res.send(err, _res.statusCode);
    }

    return res.send(obj);
  });

};

module.exports.get = function(req, res, next) {
  req.sdc['coal'].zapi.getVm({uuid:req.params.uuid}, function(err, obj) {
    return res.send(obj);
  });
};

module.exports.reboot = function(req, res, next) {
  req.sdc['coal'].zapi.rebootVm({uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return res.send(err);
    }
    return res.send(obj);
  });
};

module.exports.start = function(req, res, next) {
  req.sdc['coal'].zapi.startVm({uuid:req.params.uuid}, function(err, obj) {
    if (err) {
      return res.send(err);
    }
    return res.send(obj);
  });
};
