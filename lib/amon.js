var restify = require('restify');

module.exports = {
  createProbe: createProbe,
  listProbes: listProbes
};

// user
// machine
// XXX right now we are only allowing to search for probes by user and machine
function listProbes(req, res, next) {
  var user = req.params.user;
  var machine = req.params.machine;
  var results = [];

  req.sdc['coal'].amon.listProbes(user, function(err, probes) {
    if (err) {
      req.log.fatal(err, 'amon.listProbes Error');
      res.send(err);
      return next();
    }

    probes.forEach(function(p) {
      req.log.info(p);
      if (machine && (p.machine === machine || p.agent === machine)) {
        results.push(p);
      }
    });

    res.send(results);
    return next();
  });
}

function createProbe(req, res, next) {
  var user = req.params.user;
  var probe = {
    type: req.params.type,
    contacts: ['email'],
    config: req.params.config,
    name: req.params.name
  };

  if (typeof(user) === 'undefined') {
    res.send(new restify.ConflictError('user must be provided!'));
    return next();
  }

  if (typeof(probe.type) === 'undefined') {
    res.send(new restify.ConflictError('type must be provided!'));
    return next();
  }

  if (typeof(probe.name) === 'undefined') {
    res.send(new restify.ConflictError('name must be provided!'));
    return next();
  }

  if (typeof(probe.config) !== 'object') {
    res.send(new restify.ConflictError('config is required'));
    return next();
  }


  if (typeof(req.params.machine) !== 'undefined') {
    probe.machine = req.params.machine;
  }

  if (typeof(req.params.agent) !== 'undefined') {
    probe.agent = req.params.agent;
  }


  req.log.info(user, probe, 'Creating Probe');
  req.sdc['coal'].amon.createProbe(user, probe, function(err, obj) {
    if (err) {
      req.log.fatal(err, 'Error Creating Probe');
      res.send(err);
      return next();
    }

    res.send(obj);
    return next();
  });
}