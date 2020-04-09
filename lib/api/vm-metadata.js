/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 */

var vasync = require('vasync');

module.exports = {
    mount: function (server, pre) {
        server.post('/api/vm-metadata', pre, function vmTagsCb(req, res, next) {
            var vms = req.body.vms;
            var type = req.body.type;
            var metadata = req.body.metadata;
            var results = [];
            vasync.forEachParallel({
                inputs: vms,
                func: function tagEachVm(vm, cb) {
                    req.sdc[req.dc].vmapi.addMetadata(type, {
                        metadata:metadata,
                        uuid: vm
                    }, function tagVmCb(err, job) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        results.push(job);
                        cb(null);
                    });
                }
            }, function paraCb(paraErr) {
                if (paraErr) {
                    req.log.fatal('Error applying metadata to vms', paraErr);
                    next(paraErr);
                    return;
                }

                res.send(results);
                next();
            });
        });
    }
};
