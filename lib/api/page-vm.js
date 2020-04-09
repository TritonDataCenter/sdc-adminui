/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 */
var getRequestHeaders = require('../get-request-headers');
var vasync = require('vasync');

function getPageVmData(req, res, next) {
    var data = {};
    var dc = req.sdc[req.dc];

    dc.vmapi.getVm({
        uuid: req.query.uuid
    }, {
        headers: getRequestHeaders(req)
    }, function (err, vm) {
        if (err) {
            next(err);
            return;
        }
        if (vm.tags.JPC_tag === 'DockerHost') {
            vm.docker = true;
        }

        data.vm = vm;
        var imageUuid;
        req.log.info(vm);
        if (vm.image_uuid) {
            imageUuid = vm.image_uuid;
        } else {
            imageUuid = (Array.isArray(vm.disks) && vm.disks.length && vm.disks[0].image_uuid) || '';
        }

        vasync.parallel({funcs: [
            function getPackage(cb) {
                dc.papi.get(vm.billing_id, {}, function papiCb(_err, pkg) {
                    data.package = pkg;
                    cb(null);
                });
            },
            function getImage(cb) {
                dc.imgapi.getImage(imageUuid, function imgapiCb(getErr, img) {
                    if (!getErr && img) {
                        data.image = img;
                    }
                    cb(null);
                });
            },
            function getServer(cb) {
                if (!vm.server_uuid) {
                    cb(null);
                    return;
                }
                dc.cnapi.getServer(vm.server_uuid, function (_err, server) {
                    data.server = server;
                    cb(null);
                });
            }
        ]}, function vasyncCb(_asyncErr) {
            res.send(data);
            next();
        });
    });
}

module.exports = {
    mount: function mount(app, pre) {
        app.get({
            path: '/api/page/vm',
            name: 'GetPageVmData'
        }, pre, getPageVmData);
    }
};
