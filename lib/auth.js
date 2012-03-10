var assert = require('assert');

var Auth = module.exports = {};

Auth.mount = function (app) {
  app.get('/auth', function (req, res) {
    if (req.session.user) {
      res.send(req.session.user);
    } else {
      res.send({});
    }
  });


  app.post('/auth', function (req, res) {
    assert.ok(req.body.username);
    assert.ok(req.body.password);

    var user = req.body.username;
    var pass = req.body.password;

    req.sdc.ufds.authenticate(user, pass, function (err, u) {
      req.session.user = u;
      return res.send(err || u);
    });
  });

  app.del('/auth', function (req, res) {
    req.session.destroy();
    res.end('');
  });
};
