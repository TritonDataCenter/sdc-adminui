/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var assert = require('assert-plus');

var moray = require('moray');
var util = require('util');
var clone = require('clone');

var EventEmitter = require('events').EventEmitter;
var restify = require('restify');

var SDC = require('sdc-clients');
var IMGAPI = require('sdc-clients/lib/imgapi');

module.exports = {};
module.exports.createClients = function (config) {
    var obj = new EventEmitter();
    obj.clients = createClients(config);
    obj.handler = attachSdcClients;
    return obj;


    function attachSdcClients(req, res, next) {
        req.sdc = obj.clients;
        Object.keys(obj.clients).forEach(function (k) {
            req.dc = k;
        });
        next();
    }

    function createClients(options) {
        assert.object(options, 'options');
        assert.object(options.log, 'options.log');
        assert.object(options.datacenters, 'options.datacenters');

        var clients = {};
        clients.datacenters = [];

        for (var dc in options.datacenters) {
            var cfg = clone(options.datacenters[dc]);
            clients.datacenters.push(dc);

            assert.ok(cfg);
            assert.ok(cfg.vmapi);
            assert.ok(cfg.napi);
            assert.ok(cfg.cnapi);
            assert.ok(cfg.amon);
            assert.ok(cfg.sapi);
            assert.ok(cfg.moray);
            assert.ok(cfg.fwapi);
            assert.ok(cfg.papi);
            assert.ok(cfg.workflow);

            clients[dc] = {};
            clients[dc].vmapi = new SDC.VMAPI(cfg.vmapi);
            clients[dc].napi = new SDC.NAPI(cfg.napi);
            clients[dc].cnapi = new SDC.CNAPI(cfg.cnapi);
            clients[dc].fwapi = new SDC.FWAPI(cfg.fwapi);
            clients[dc].amon = new SDC.Amon(cfg.amon);
            clients[dc].workflow = restify.createJsonClient(cfg.workflow);

            cfg.sapi.log = options.log.child({
                component: util.format('%s/sapi', dc),
                level: 'INFO'
            });

            clients[dc].sapi = new SDC.SAPI(cfg.sapi);
            clients[dc].imgapi = new IMGAPI(cfg.imgapi);
            clients[dc].papi = new SDC.PAPI(cfg.papi);

            cfg.moray.no_count = true;

            clients[dc].moray = createMorayClient({
                config: cfg.moray,
                log: options.log.child({
                    component: util.format('%s/moray', dc),
                    level: 'INFO'
                })
            });

            clients[dc].moray.on('connect', function() {
                obj.emit('morayReady', clients[dc].moray);
            });
        }

        return clients;
    }


    function createMorayClient(opts) {
        assert.ok(opts);
        assert.ok(opts.config);
        assert.ok(opts.log);


        var cfg = clone(opts.config);
        cfg.log = opts.log;
        cfg.reconnect = true;
        cfg.retry = {
            retries: Infinity,
            minTimeout: 1000,
            maxTimeout: 16000
        };

        var client = moray.createClient(cfg);

        client.on('error', function (e) {
            client.log.fatal(e, 'Moray Connection Error');
            client.connected = false;
        });

        return client;
    }
};
