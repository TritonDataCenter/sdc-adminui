var assert = require('assert');

module.exports.list = function(req, res, next) {
  req.sdc['coal'].napi.listNetworks(function listNetworks(err, obj, _req, _res) {

    if (err) {
      return res.send(err, _res.statusCode);
    }

    return res.send(obj);
  });
}
