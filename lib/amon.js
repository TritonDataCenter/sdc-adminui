var restify = require('restify');

module.exports = {
    createProbe: createProbe,
    listProbes: listProbes,
    deleteProbe: deleteProbe,
    listAlarms: listAlarms,
    listProbeGroups: listProbeGroups
};

// user
// machine
// XXX right now we are only allowing to search for probes by user and machine
function listProbes(req, res, next) {
    var user = req.params.user;
    var results = [];

    req.sdc[req.dc].amon.listProbes(user, function(err, probes) {
        if (err) {
            req.log.fatal(err, 'amon.listProbes Error');
            res.send(err);
            return next();
        }

        res.send(probes);
        return next();
    });
}

function createProbe(req, res, next) {
    var user = req.body.user;
    var probe = {
        type: req.body.type,
        contacts: ['email'],
        config: req.body.config || {},
        name: req.body.name
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


    if (typeof(req.body.machine) !== 'undefined') {
        probe.machine = req.body.machine;
    }

    if (typeof(req.body.agent) !== 'undefined') {
        probe.agent = req.body.agent;
    }


    req.log.info(user, probe, 'Creating Probe');
    req.sdc[req.dc].amon.createProbe(user, probe, function(err, obj) {
        if (err) {
            req.log.fatal(err, 'Error Creating Probe');
            res.send(err);
            return next();
        }

        res.send(obj);
        return next();
    });
}


function deleteProbe(req, res, next) {
    var user = req.params.user;
    var uuid = req.params.uuid;

    req.sdc[req.dc].amon.deleteProbe(user, uuid, function(err, obj) {
        if (err) {
            req.log.fatal(err, 'Error Deleting Probe');
            res.send(err);
        } else {
            res.send(obj);
        }
        return next();
    });
}

function listProbeGroups(req, res, next) {
    var user = req.params.user;
    
    req.sdc[req.dc].amon.listProbeGroups(user, function(err, pgs) {
        if (err) {
            req.log.fatal(err, 'Error retrieving probes for %s', user);
            res.send(err);
        } else {
            res.send(pgs);
        }

        return next();
    });
}


function listAlarms(req, res, next) {
    var user = req.params.user;

    req.sdc[req.dc].amon.listAlarms(user, function(err, alarms) {
        if (err) {
            req.log.fatal(err, 'Error retrieving alarms for %s', user);
            return next(err);
        } else {
            res.send(alarms);
        }

        return next();
    });
}
