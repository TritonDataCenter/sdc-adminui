var assert = require('assert');
var SDC = require('sdc-clients');

module.exports = {};
module.exports.sdc = function (config) {

  function createClients(options) {
    assert.ok(options);
    assert.ok(options.ufds);
    assert.ok(options.datacenters);

    var clients = {};

    for (var dc in options.datacenters) {
      var cfg = options.datacenters[dc];

      assert.ok(cfg);
      assert.ok(cfg.vmapi);
      assert.ok(cfg.napi);
      assert.ok(cfg.cnapi);

      clients[dc] = {
        vmapi: new SDC.VMAPI(cfg.vmapi),
        napi: new SDC.NAPI(cfg.napi),
        cnapi: new SDC.CNAPI(cfg.cnapi)
      };

      clients.ufds = new SDC.UFDS(options.ufds);
    }

    return clients;
  }

  var _clients = createClients(config);

  return function (req, res, next) {
    req.sdc = _clients;
    next();
  };

};
