var assert = require('assert');

module.exports.mount = function mount(app) {
  app.get('/servers', listServers);
};

function listServers(req, res, next) {
  req.sdc['coal'].cnapi.listServers(function listServersCallback(err, obj) {
    assert.ifError(err);
    return res.send(obj);
  });
}
