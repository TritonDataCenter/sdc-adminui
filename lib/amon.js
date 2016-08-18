/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var restify = require('restify');
var format = require('util').format;

module.exports = {
    createProbe: createProbe,
    listProbes: listProbes,
    deleteProbe: deleteProbe,
    getProbe: getProbe,
    listAlarms: listAlarms,
    listProbeGroups: listProbeGroups,
    getProbeGroup: getProbeGroup,
    alarmAction: alarmAction,
    getAlarm: getAlarm
};

// user
// machine
// XXX right now we are only allowing to search for probes by user and machine
function listProbes(req, res, next) {
    var user = req.params.user;

    req.sdc[req.dc].amon.listProbes(user, function (err, probes) {
        if (err) {
            req.log.fatal(err, 'amon.listProbes Error');
            res.send(err);
            return next();
        }

        res.send(probes);
        return next();
    });
}

function alarmAction(req, res, next) {
    var user = req.params.user;
    var uuid = req.params.uuid;
    var act = req.params.action;
    var body = req.body || {};
    req.sdc[req.dc].amon.client.post(
        format('/pub/%s/alarms/%s?action=%s', user, uuid, act),
        body,
        function didAmonAction(err, rReq, rRes, obj) {
        if (err) {
            req.log.fatal(err.message, 'Error performing alarm action');
            return next(err);
        }
        res.send(obj);
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

    if (typeof (user) === 'undefined') {
        res.send(new restify.ConflictError('user must be provided!'));
        return next();
    }

    if (typeof (probe.type) === 'undefined') {
        res.send(new restify.ConflictError('type must be provided!'));
        return next();
    }

    if (typeof (probe.name) === 'undefined') {
        res.send(new restify.ConflictError('name must be provided!'));
        return next();
    }

    if (typeof (probe.config) !== 'object') {
        res.send(new restify.ConflictError('config is required'));
        return next();
    }


    if (typeof (req.body.machine) !== 'undefined') {
        probe.machine = req.body.machine;
    }

    if (typeof (req.body.agent) !== 'undefined') {
        probe.agent = req.body.agent;
    }


    req.log.info(user, probe, 'Creating Probe');
    req.sdc[req.dc].amon.createProbe(user, probe, function (err, obj) {
        if (err) {
            req.log.fatal(err, 'Error Creating Probe');
            res.send(err);
            return next();
        }

        res.send(obj);
        return next();
    });

    return null;
}

function getProbe(req, res, next) {
    var user = req.params.user;
    var uuid = req.params.uuid;

    req.sdc[req.dc].amon.getProbe(user, uuid, function (err, obj) {
        if (err) {
            req.log.fatal(err, 'Error Retrieving Probe');
            res.send(err);
        } else {
            res.send(obj);
        }
        return next();
    });
}

function deleteProbe(req, res, next) {
    var user = req.params.user;
    var uuid = req.params.uuid;

    req.sdc[req.dc].amon.deleteProbe(user, uuid, function (err, obj) {
        if (err) {
            req.log.fatal(err, 'Error Deleting Probe');
            res.send(err);
        } else {
            res.send(obj);
        }
        return next();
    });
}

function getProbeGroup(req, res, next) {
    var user = req.params.user;
    var uuid = req.params.uuid;

    req.sdc[req.dc].amon.getProbeGroup(user, uuid, function (err, pg) {
        if (err) {
            req.log.fatal(err, 'Error retrieving probegroup uuid:%s for %s', uuid, user);
            return next(err);
        } else {
            res.cache('public', {maxAge: 86400 });
            res.send(pg);
        }

        return next();
    });
}

function listProbeGroups(req, res, next) {
    var user = req.params.user;

    req.sdc[req.dc].amon.listProbeGroups(user, function (err, pgs) {
        if (err) {
            req.log.fatal(err, 'Error retrieving probes for %s', user);
            return next(err);
        } else {
            res.send(pgs);
        }

        return next();
    });
}

function getAlarm(req, res, next) {
    var user = req.params.user;
    var id = Number(req.params.uuid);
    req.sdc[req.dc].amon.getAlarm(user, id, function (err, alarm) {
        if (err) {
            req.log.fatal(err, 'Error retreiving alarm from amon');
            return next(err);
        }
        res.send(alarm);
        return next();
    });
}


function listAlarms(req, res, next) {
    var user = req.params.user;
    var params = {};
    if (req.params.state) {
        params.state = req.params.state;
    }

    req.sdc[req.dc].amon.listAlarms(user, params, function (err, alarms) {
        if (err) {
            req.log.fatal(err, 'Error retrieving alarms for %s', user);
            return next(err);
        } else {
            alarms = alarms.sort(function (a, b) {
                return b.timeLastEvent - a.timeLastEvent;
            }).slice(0, 500);
            res.send(alarms);
        }

        return next();
    });
}
