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
        server.post('/api/vm-reboot', pre, function vmRebootCb(req, res, next) {
            var vms = req.body;
            var results = [];

            vasync.forEachParallel({
                inputs: vms,
                func: function rebootEachVm(vm, cb) {
                    req.sdc[req.dc].vmapi.rebootVm({
                        uuid: vm
                    }, function rebootVmCb(err, job) {
                        if (err) {
                            cb(err);
                            return;
                        }
                        results.push(job);
                        cb(null);
                    });
                }
            }, function done(err) {
                if (err) {
                    req.log.fatal('Error rebooting vms', err);
                    next(err);
                    return;
                }

                res.send(results);
                next();
            });
        });
    }
};
