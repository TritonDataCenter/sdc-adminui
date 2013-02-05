var assert = require('assert');
var SDC = require('sdc-clients');
var moray = require('moray');
var util = require('util');
var IMGAPI = require('sdc-clients/lib/imgapi');
var EventEmitter = require('events').EventEmitter;


module.exports = {};
module.exports.createClients = function(config) {
    var _clients = createClients(config);
    var obj = new EventEmitter();
    var log = config.log;
    obj.clients = _clients;
    obj.handler = handler;
    return obj;

    function createUfdsClient(options, clients, log) {
        var c = new SDC.UFDS(options);
        var clog = log.child({
            component: 'ufds'
        });

        c.on('error', function(e) {
            obj.emit('error', 'ufds', e);
            if (e.errno === 'ECONNREFUSED') {
                clog.fatal(e, 'UFDS Connection Error');
                setTimeout(function() {
                    clog.fatal(e, 'Attempting to reconnect...');
                    createUfdsClient(options, clients, log);
                }, 3000);
            } else {
                clog.fatal(e);
            }
        });

        clients.ufds = c;
        clients.package = new SDC.Package(c);
    }
    
    function createClients(options) {
        assert.ok(options);
        assert.ok(options.ufds);
        assert.ok(options.datacenters);

        var clients = {};
        createUfdsClient(options.ufds, clients, options.log);

        for (var dc in options.datacenters) {
            var cfg = options.datacenters[dc];

            assert.ok(cfg);
            assert.ok(cfg.vmapi);
            assert.ok(cfg.napi);
            assert.ok(cfg.cnapi);
            assert.ok(cfg.amon);
            assert.ok(cfg.moray);

            clients[dc] = {};
            clients[dc].vmapi = new SDC.VMAPI(cfg.vmapi);
            clients[dc].napi = new SDC.NAPI(cfg.napi);
            clients[dc].cnapi = new SDC.CNAPI(cfg.cnapi);
            clients[dc].amon = new SDC.Amon(cfg.amon);
            clients[dc].imgapi = new IMGAPI(cfg.imgapi);

            cfg.moray.log = options.log.child({
                component: 'moray',
                level: 'INFO'
            });

            var morayClient = moray.createClient(cfg.moray);
            morayClient.log = cfg.moray.log;

            morayClient.on('connect', function() {
                obj.emit('morayReady', morayClient);
            });

            clients[dc].moray = morayClient;
        }

        return clients;
    }


    function handler(req, res, next) {
        req.sdc = _clients;
        Object.keys(_clients).forEach(function(k) {
            if (k === 'ufds' || k === 'package') {
                return;
            }
            req.dc = k;
        });
        next();
    };

};