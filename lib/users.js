var uuid = require('node-uuid').uuid;
var sprintf = require('util').format;

module.exports = {
  create: create,
  count: count,
  list: list,
  get: get
};



function get(req, res, next) {
  var login = req.params.login;
  req.sdc.ufds.getUser(login, function(err, user) {
    if (err)
      return next(err);

    res.send(user);
  });
}

function list(req, res, next) {
  var login = req.params.login;

  var opts = {
    scope: 'one',
    attributes: ['*'],
    filter: '(&(objectclass=sdcperson)(login='+login+'*))'
  }

  req.sdc.ufds.search('ou=users,o=smartdc', opts, function(err, users) {
    if (err) {
      return next(err);
    }

    res.send(users);
  });
}

function count(req, res, next) {
  var opts = {
    scope: 'one',
    attributes: ['*', 'memberof'],
    filter: '(objectclass=sdcperson)'
  };

  req.sdc.ufds.search('ou=users, o=smartdc', opts, function (err, u) {
    res.send({ count: u.length });
  });
}

function create(req, res, next) { // {{{
  var errors = [];
  var params = req.body;

  if (! params.login) errors.push('Login is required');
  if (! params.password) errors.push('Password is required');
  if (! params.email) errors.push('Email is required');
  if (! params.first_name) errors.push('First name is required');
  if (! params.last_name) errors.push('Last name is required');
  if (! params.company_name) errors.push('Company name is required');

  if (errors.length > 0) {
    return res.send({error: errors}, 409);
  }

  var user = {
    login: params.login,
    userpassword: params.password,
    email: params.email,
    cn: params.first_name,
    sn: params.last_name,
    company: params.company_name
  };

  return req.sdc.ufds.getUser(user.login, _getUserCallback);

  function _getUserCallback(err) {
    if (err && err.httpCode === 404) {
      return _doAddUser(user);
    } else {
      return res.send({error:['A user with this login already exists']}, 409);
    }
  }

  function _doAddUser(userobj) {
    return req.sdc.ufds.addUser(userobj, function (err, u) {
      if (err) {
        return res.send(err, 409);
      } else {
        return res.send(u);
      }
    });
  }
} // }}}
