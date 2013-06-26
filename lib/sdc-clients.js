var assert = require('assert-plus');
var _ = require('underscore');

var moray = require('moray');
var util = require('util');
var clone = require('clone');

var EventEmitter = require('events').EventEmitter;
var restify = require('restify');

var SDC = require('sdc-clients');
var IMGAPI = require('sdc-clients/lib/imgapi');

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
        createUfdsClient(options.ufds, clients, options.log, 'ufds');

        if (!options.ufdsMaster ||
            (typeof(options.ufdsMaster.url) === 'string' &&
            options.ufdsMaster.url === 'ldaps://'))
        {
            options.log.warn('ufdsMaster configuration incomplete, using local ufds');
            createUfdsClient(options.ufds, clients, options.log, 'ufdsMaster');
        } else {
            createUfdsClient(options.ufdsMaster, clients, options.log, 'ufdsMaster');
        }

        for (var dc in options.datacenters) {
            var cfg = clone(options.datacenters[dc]);

            assert.ok(cfg);
            assert.ok(cfg.vmapi);
            assert.ok(cfg.napi);
            assert.ok(cfg.cnapi);
            assert.ok(cfg.amon);
            assert.ok(cfg.sapi);
            assert.ok(cfg.moray);
            assert.ok(cfg.fwapi);
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

    function createUfdsClient(options, clients, log, key) {
        var ufdslog = log.child({component: key});
        ufdslog.info('Connecting to UFDS');

        options = _.defaults(options, {
            clientTimeout: 2000,     // maximum operation time
            connectTimeout: 4000,
            retry: {
                maxDelay: 8000
            }
        });

        var ufds = new SDC.UFDS(options);
        ufds.adminUuid = options.adminUuid;

        clients[key] = ufds;

        if (key === 'ufds') {
            clients.package = new SDC.Package(ufds);
        }

        ufds.once('connect', function() {
            ufds.removeAllListeners('error');

            ufds.on('connect', function() {
                ufdslog.info('UFDS Reconnected');
            });

            ufds.on('close', function() {
                ufdslog.info('UFDS Connection Closed');
            });

            ufds.on('error', function (err) {
                ufdslog.warn(err, 'UFDS: unexpected error occurred');
            });
        });


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

        client.on('connect', function() {
            client.emit('ready', client);
        });

        client.on('error', function(e) {
            client.log.fatal(e, 'Moray Connection Error');
        });

        return client;
    }
};
