/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports = {
    list: function(req, res, next) {
        req.sdc[req.dc].cnapi.get('/platforms', function (err, obj, _req, _res) {
            if (err) {
                req.log.fatal(err, 'CNAPI Error retrieving platforms');
                return next(err, _res.statusCode);
            }

            res.send(obj);
            return next();
        });
    }
};
