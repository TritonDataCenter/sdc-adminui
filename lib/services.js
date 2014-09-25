/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports = {
    listApplications: function (req, res, next) {
        req.sdc[req.dc].sapi.listApplications(req.getQuery(), function (err, obj) {
            if (err) {
                req.log.fatal(err, 'Error retreiving applications');
                return next(err);
            } else {
                res.send(obj);
                return next();
            }
        });
    },
    listInstances: function (req, res, next) {
        req.sdc[req.dc].sapi.listInstances(req.getQuery(), function (err, obj) {
            if (err) {
                req.log.fatal(err, 'Error retreiving instances');
                return next(err);
            } else {
                res.send(obj);
                return next();
            }
        });
    },
    listServices: function (req, res, next) {
        req.sdc[req.dc].sapi.listServices(req.getQuery(), function (err, services) {
            if (err) {
                req.log.fatal(err, 'Error retrieving services');
                return next(err);
            } else {
                res.send(services);
                return next();
            }
        });
    },
    getService: function (req, res, next) {
        req.sdc[req.dc].sapi.getService(req.params.uuid, function (err, service) {
            if (err) {
                req.log.fatal(err, 'Error retrieving service');
                return next(err);
            } else {
                res.send(service);
                return next();
            }
        });
    }
};
