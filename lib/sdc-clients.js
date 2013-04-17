var assert = require('assert-plus');
var SDC = require('sdc-clients');
var moray = require('moray');
var util = require('util');
var clone = require('clone');
var IMGAPI = require('sdc-clients/lib/imgapi');
var EventEmitter = require('events').EventEmitter;

module.exports = {};
module.exports.createClients = function(config) {
    var obj = new EventEmitter();
    obj.clients = createClients(config);
    obj.handler = handler;
    return obj;


    function handler(req, res, next) {
        req.sdc = obj.clients;
        Object.keys(obj.clients).forEach(function(k) {
            if (k === 'ufds' || k === 'package') {
                return;
            }
            req.dc = k;
        });
        next();
    }


    function onMorayReady(client) {
        obj.emit('morayReady', client);
    }

    function createClients(options) {
        assert.object(options, 'options');
        assert.object(options.log, 'options.log');
        assert.object(options.ufds, 'options.ufds');
        assert.object(options.datacenters, 'options.datacenters');

        var clients = {};
        createUfdsClient(options.ufds, clients, options.log);

        for (var dc in options.datacenters) {
            var cfg = clone(options.datacenters[dc]);

            assert.ok(cfg);
            assert.ok(cfg.vmapi);
            assert.ok(cfg.napi);
            assert.ok(cfg.cnapi);
            assert.ok(cfg.amon);
            assert.ok(cfg.sapi);
            assert.ok(cfg.moray);

            clients[dc] = {};
            clients[dc].vmapi = new SDC.VMAPI(cfg.vmapi);
            clients[dc].napi = new SDC.NAPI(cfg.napi);
            clients[dc].cnapi = new SDC.CNAPI(cfg.cnapi);
            clients[dc].amon = new SDC.Amon(cfg.amon);

            cfg.sapi.log = options.log.child({
                component: util.format('%s/sapi', dc),
                level: 'INFO'
            });

            clients[dc].sapi = new SDC.SAPI(cfg.sapi);

            clients[dc].imgapi = new IMGAPI(cfg.imgapi);

            clients[dc].moray = createMorayClient({
                config: cfg.moray,
                log: options.log.child({
                    component: util.format('%s/moray', dc),
                    level: 'INFO'
                })
            });
            clients[dc].moray.on('ready', onMorayReady);
        }

        return clients;
    }

    function createUfdsClient(options, clients, log) {
        var ufdslog = log.child({component: 'ufds'});
        ufdslog.info('Connecting to UFDS');

        var ufds = new SDC.UFDS(options);
        var codesToRetry = [
            'EHOSTUNREACH',
            'ETIMEDOUT',
            'ECONNREFUSED'
        ];

        ufds.on('error', function(e) {
            ufdslog.info(e.errorno);
            if (codesToRetry.indexOf(e.errno) !== -1) {
                ufdslog.fatal(e, 'UFDS Connection Error');
                setTimeout(function() {
                    createUfdsClient(options, clients, log);
                }, 3000);
            } else {
                ufdslog.warn(e, 'UFDS Error');
            }
        });
        ufds.adminUuid = options.adminUuid;
        clients.ufds = ufds;
        clients.package = new SDC.Package(ufds);
    }

    function createMorayClient(opts) {
        assert.ok(opts);
        assert.ok(opts.config);
        assert.ok(opts.log);

        var cfg = clone(opts.config);
        cfg.log = opts.log;

        var client = moray.createClient(cfg);

        client.on('connect', function() {
            client.emit('ready', client);
        });

        client.on('error', function(e) {
            client.log.fatal(e, 'Moray Connection Error');
        });

        return client;
    }
};
