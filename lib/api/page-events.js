/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var SDCEvents = require('sdc-events');
var streamBuffers = require("stream-buffers");
var url = require('url');


var PageEvents = {
    index: function(req, res, next) {
        var sdcconfig = req.app.config.datacenters[req.dc];

        var buf = new streamBuffers.ReadableStreamBuffer();
        var sdcevents = new SDCEvents({
            log: req.log.child({component: 'sdc-event'}),
            out: buf,
            zonename: 'adminui',
            config: {
                rabbitmq: sdcconfig.rabbitmq,
                vmapi_domain: url.parse(sdcconfig.vmapi.url).hostname,
                cnapi_domain: url.parse(sdcconfig.cnapi.url).hostname,
                sapi_domain: url.parse(sdcconfig.sapi.url).hostname,
                admin_ip: '10.99.99.7'
            }
        });

        sdcevents.search({
            filters: [['evt', 'exists']],
            time: new Date(Date.now() - 60*60*1000)
        });

        buf.on('data', function(chunk) {
            console.log(chunk);
        });

        buf.on('end', function() {
            res.end();
        });
    },

    mount: function(server, pre) {
        server.get({name: 'EventsPage', path: '/api/page-events/index'}, pre, PageEvents.index);
    }
};

module.exports = PageEvents;
