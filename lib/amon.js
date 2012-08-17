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

  var monitors = req.sdc['coal'].amon.listMonitors(user, onListMonitorsCallback);

  var results = [];
  var monCount;

  function onListMonitorsCallback(err, monitors) {
    monCount = monitors.length;
    if (monCount === 0) {
      res.send([]);
      return next();
    }

    monitors.forEach(function(m) {
      req.sdc['coal'].amon.listProbes(user, m.name, onListProbesCallback);
    });
  }

  function onListProbesCallback(err, probes) {
    monCount--;

    probes.forEach(function(p) {
      req.log.info('', p);
      if (machine && (p.machine === machine || p.agent === machine)) {
        results.push(p);
      }
    });

    if (monCount === 0) {
      res.send(results);
      return next();
    }
  }
}

function createProbe(req, res, next) {
  var user = req.params.user;
  var type = req.params.type;
  var name = req.params.name;
  var config = req.params.config;
  var monitor = { contacts: ['email'] };

  if (typeof(user) === 'undefined') {
    res.send(new restify.ConflictError('name must be provided!'));
    return next();
  }

  if (typeof(name) === 'undefined') {
    res.send(new restify.ConflictError('name must be provided!'));
    return next();
  }

  if (typeof(type) === 'undefined') {
    res.send(new restify.ConflictError('probe type must be provided!'));
    return next();
  }

  if (typeof(config) !== 'object') {
    res.send(new restify.ConflictError('config is required'));
    return next();
  }

  req.sdc['coal'].amon.putMonitor(user, name, monitor, function(err, obj) {
    if (err) {
      req.log.fatal(err);
      res.send(err, 'Error Creating Monitor');
      return next();
    }

    var probeName = 'probe-' + name;

    var probe = {};
    probe.config = req.params.config;
    probe.type = req.params.type;

    if (typeof(req.params.machine) !== 'undefined') {
      probe.machine = req.params.machine;
    }

    if (typeof(req.params.agent) !== 'undefined') {
      probe.agent = req.params.agent;
    }


    req.sdc['coal'].amon.putProbe(user, name, probeName, probe, function(err, obj) {
      if (err) {
        req.log.fatal(err, 'Error Creating Probe');
        res.send(err);
        return next();
      }

      res.send(obj);
      return next();
    });

  });

}
