var assert = require('assert');

module.exports.mount = function mount(app) {
  app.get('/machines', listMachines);
};

function listMachines(req, res, next) {
  req.sdc['coal'].zapi.listMachines(function listMachinesCb(err, obj) {
    assert.ifError(err);
    return res.send(obj);
  });
}
