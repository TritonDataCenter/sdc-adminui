/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2019, Joyent, Inc.
 */

var restify = require('restify');
var netconfig = require('triton-netconfig');

module.exports = function imgapiExternalNicStatus(req, res, next) {
    req.sdc[req.dc].vmapi.listVms({
        'state':'active',
        'tag.smartdc_role':'imgapi',
        'tag.smartdc_type':'core'
    }, function listVmsCallback(err, vms) {
        if (err || !vms[0]) {
            return next(new restify.InternalError(
                'Unable to retrieve nic information'));
        }

        var externalNic = vms[0].nics.filter(netconfig.isNicExternal);

        res.send({
            imgapiUuid: vms[0].uuid,
            externalNic: externalNic !== undefined
        });
        return next();
    });
};
