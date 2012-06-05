var assert = require('assert');

module.exports.list = function listServers(req, res, next) {

  req.sdc['coal'].cnapi.listServers(function listServersCallback(err, obj, _req, _res) {
    if (err) {
      return res.send(err, _res.statusCode);
    }

    return res.send(obj);
  });
}
