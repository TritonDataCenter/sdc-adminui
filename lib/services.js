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
        req.sdc[req.dc].sapi.listApplications(req.query, function (err, obj) {
            if (err) {
                req.log.error(err, 'Error retreiving applications');
                return next(err);
            }
            res.send(obj);
            return next();
        });
    },
    listInstances: function (req, res, next) {
        req.sdc[req.dc].sapi.listInstances(req.query, function (err, obj) {
            if (err) {
                req.log.error(err, 'Error retreiving instances');
                return next(err);
            }
            res.send(obj);
            return next();
        });
    },
    listServices: function (req, res, next) {
        req.sdc[req.dc].sapi.listServices(req.query, function (err, services) {
            if (err) {
                req.log.error(err, 'Error retrieving services');
                return next(err);
            }
            res.send(services);
            return next();
        });
    },
    getService: function (req, res, next) {
        req.sdc[req.dc].sapi.getService(req.params.uuid, function (err, service) {
            if (err) {
                req.log.error(err, 'Error retrieving service');
                return next(err);
            }
            res.send(service);
            return next();
        });
    },
    updateService: function (req, res, next) {
        req.sdc[req.dc].sapi.updateService(req.params.uuid, req.body, function (err, service) {
            if (err) {
                req.log.error(err, 'Error updating service');
                return next(err);
            }
            res.send(service);
            return next();
        });
    }
};
