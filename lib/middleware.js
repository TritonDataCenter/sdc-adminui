var assert = require('assert');
var SDC = require('sdc-clients');

module.exports = {};

module.exports.sdc = function (config) {

  function createClients(options) {
    assert.ok(options);
    assert.ok(options.mapi);
    assert.ok(options.ufds);

    var ufds = new SDC.UFDS(options.ufds);

    ufds.on('error', function (err) {
      options.log.error(err);
    });


    var mapi = new SDC.MAPI(options.mapi);

    return {
      ufds: ufds,
      mapi: mapi
    };
  }

  var _clients = createClients(config);

  return function (req, res, next) {
    req.sdc = _clients;
    next();
  };

};
