/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */


var TraceEvent = require('trace-event');

module.exports = {
    mount: function (options) {
        var server = options.server;
        var skipRoutes = options.skipRoutes || [];

        server.use(function (req, res, next) {
            req.trace = TraceEvent.createBunyanTracer({ log: req.log });
            if (req.route && !skipRoutes.indexOf(req.route.name || req.route.path) === -1) {
                req.trace.begin(req.route.name);
            }
            next();
        });

        server.on('after', function (req, res, route, err) {
            if (route && skipRoutes.indexOf[route.name] === -1) {
                req.trace.end(route.name);
            }
        });
    }
};
