var assert = require('assert');

/**
 * Params
 * ===
 * params.uuid
 */
module.exports.get = function getServer(req, res, next) {
  req.sdc[req.dc].cnapi.getServer(req.params.uuid,
                                  function listServersCallback(err, obj, _req, _res) {

    if (err) {
      return next(err, _res.statusCode);
    }

    res.send(obj);
    return next();
  });
};


module.exports.setup = function setupServer(req, res, next) {
  req.sdc[req.dc].cnapi.setupServer(
    req.params.uuid,
    function setupServerCallback(err, obj, _req, _res) {

      if (err) {
        req.log.error(err);
        return next(err, _res.statusCode);
      }

      res.send(obj);
      return next();
    }
  );
};

module.exports.list = function listServers(req, res, next) {
  req.sdc[req.dc].cnapi.listServers(req.params, function(err, obj, _req, _res) {
    if (err) {
      req.log.error(err);
      return next(err, _res.statusCode);
    }

    res.send(obj);
    return next();
  });
};