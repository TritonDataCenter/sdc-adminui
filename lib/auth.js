var assert = require('assert');

var Auth = module.exports = {};

Auth.mount = function (app) {
  app.get('/auth', function (req, res) {
    if (req.session.user) {
      return res.send(req.session.user);
    } else {
      return res.json({});
    }
  });


  app.post('/auth', function (req, res, next) {
    if (typeof (req.body.username) === 'undefined') {
      return next(new Error('Username Required'));
    }

    if (typeof (req.body.password) === 'undefined') {
      return next(new Error('Username Required'));
    }

    var user = req.body.username;
    var pass = req.body.password;

    return req.sdc.ufds.authenticate(user, pass, function (err, u) {
      if (err) {
        return next(new Error(err));
      }

      req.session.user = u;
      return res.json(err || u);
    });
  });

  app.del('/auth', function (req, res) {
    req.session.destroy();
    return res.end('');
  });
};
