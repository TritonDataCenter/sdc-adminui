var assert = require('assert');

module.exports.list = function(req, res, next) {
  req.sdc['coal'].napi.listNetworks(function listNetworks(err, obj, _req, _res) {

    if (err) {
      res.send(err, _res.statusCode);
      return next();
    }

    res.send(obj);
    return next();
  });
}
