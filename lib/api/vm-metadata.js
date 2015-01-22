/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var async = require('async');

module.exports = {
    mount: function (server, pre) {
        server.post('/api/vm-metadata', pre, function vmTagsHandler(req, res, next) {
            var vms = req.body.vms;
            var type = req.body.type;
            var metadata = req.body.metadata;

            async.map(vms, function tagEachVm(vm, cb) {
                req.sdc[req.dc].vmapi.addMetadata(type, { metadata:metadata, uuid: vm }, function tagVmCb(err, job) {
                    cb(err, job);
                });
            }, function done(err, results) {
                if (err) {
                    req.log.fatal('Error applying metadata to vms', err);
                    return next(err);
                }

                res.send(results);
                return next();
            });
        });
    }
};
