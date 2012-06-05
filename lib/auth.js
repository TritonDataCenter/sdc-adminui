var assert = require('assert');

var Auth = module.exports = {};

Auth.checkAuth = function (req, res, next) {
  req.log.info("check auth");

  req.sdc.ufds.getUser('admin', function(err, user) {
    if (err) {
      return next(err);
    }

    res.send(user)
    return next();
  });
};


Auth.authenticate = function (req, res, next) {
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
    return res.send(err || u);
  });
}

Auth.signout = function (req, res, next) {
  req.session.destroy();
  return res.end('');
}
