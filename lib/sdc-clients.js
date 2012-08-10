var assert = require('assert');
var SDC = require('sdc-clients');
var util = require('util');

module.exports = {};
module.exports.sdc = function (config) {

  function createUfdsClient(options, clients, log) {
    var c = new SDC.UFDS(options);
    var clog = log.child({component:'ufds'});

    c.on('error', function(e) {
      if (e.errno === 'ECONNREFUSED') {
        clog.fatal(e, 'UFDS Connection Error');
        setTimeout(function() {
          clog.fatal(e, 'Attempting to reconnect...');
          createUfdsClient(options, clients, log);
        }, 3000)
      } else {
        log.ch
      }
    });
    clients.ufds = c;
  }

  function createClients(options) {
    assert.ok(options);
    assert.ok(options.ufds);
    assert.ok(options.datacenters);

    var clients = {};
    createUfdsClient(options.ufds, clients, options.log);

    for (var dc in options.datacenters) {
      var cfg = options.datacenters[dc];

      assert.ok(cfg);
      assert.ok(cfg.vmapi);
      assert.ok(cfg.napi);
      assert.ok(cfg.cnapi);
      assert.ok(cfg.amon);

      clients[dc] = {};

      clients[dc].vmapi = new SDC.VMAPI(cfg.vmapi);
      clients[dc].napi = new SDC.NAPI(cfg.napi);
      clients[dc].cnapi = new SDC.CNAPI(cfg.cnapi);
      clients[dc].amon = new SDC.Amon(cfg.amon);
    }

    return clients;
  }

  var _clients = createClients(config);

  return function (req, res, next) {
    req.sdc = _clients;
    next();
  };

};
