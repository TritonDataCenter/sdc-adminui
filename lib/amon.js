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
  var monitorName = req.params.name;
  var monitor = { contacts: ['email'] };

  req.sdc['coal'].amon.putMonitor(user, monitorName, monitor, function(err, obj) {
    if (err) {
      req.log.fatal(err);
      res.send(err, 'Error Creating Monitor');
      return next();
    }

    var probeName = 'probe-'+monitorName;
    var probe = {};
    probe.config = req.params.config;
    probe.machine = req.params.machine;
    probe.agent = req.params.agent;
    probe.type = req.params.type;

    req.sdc['coal'].amon.putProbe(user, monitorName, probeName, probe, function(err, obj) {
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
