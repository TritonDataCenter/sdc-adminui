var assert = require('assert');

module.exports.mount = function mount(app) {
  app.get('/vms', listMachines);
};

function listMachines(req, res, next) {
  req.sdc['coal'].zapi.listMachines(function listMachinesCb(err, obj, _req, _res) {
    if (err) {
      res.send(err, _res.statusCode);
    }
    return res.send(obj);
  });
}
