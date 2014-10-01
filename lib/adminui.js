/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var fs = require('fs');
var path = require('path');
var assert = require('assert-plus');
var util = require('util');

var restify = require('restify');

var EventEmitter = require('events').EventEmitter;
var HttpsEnforcer = require('./https-enforcer');
var Sessions = require('./sessions');
var caproxy = require('./caproxy');

var mime = require('mime');

mime.define({
    'application/font-woff': ['woff']
});

var notes = require('./notes');
var settings = require('./settings');

function resume(req, res, next) {
    process.nextTick(function () {
        req.resume();
    });
    next();
}

var bodyParser = restify.bodyParser({mapParams: false});

var ADMINUI = function (options) {
    EventEmitter.call(this);

    assert.object(options.config, 'options.config');
    assert.object(options.log, 'options.log');

    this.root = path.join(__dirname, '..');
    this.config = options.config;
    this.log = options.log;
    this.log.info(process.env.NODE_PATH);

    this.httpsEnforcer = HttpsEnforcer.createServer({
        sslport: this.config.sslport,
        port: this.config.port,
        log: this.log
    });


    this.config.ufds.log = this.log.child({component: 'ufds'});
    this.ufds = require('./ufds').createUfdsClient(this.config.ufds);

    this.config.ufdsMaster.log = this.log.child({component: 'ufdsMaster'});
    this.config.ufdsMaster.master = true;
    this.ufdsMaster = require('./ufds').createUfdsClient(this.config.ufdsMaster);


    this.server = this.createServer();
    this.server.root = this.root;
};

util.inherits(ADMINUI, EventEmitter);

ADMINUI.prototype.createServer = function () {

    var config = this.config;
    var log = this.log;

    assert.string(config.ssl.certificate, 'ssl certificate required');
    assert.string(config.ssl.key, 'ssl keyfile required');

    var cert = fs.readFileSync(config.ssl.certificate, 'ascii');
    var key = fs.readFileSync(config.ssl.key, 'ascii');

    var server = restify.createServer({
        name: 'adminui',
        log: log,
        certificate: cert,
        key: key
    });

    server.pre(restify.pre.pause());
    server.use(restify.queryParser());
    server.use(restify.gzipResponse());
    server.use(restify.acceptParser(server.acceptable));

    if (config.simulateLatency) {
        server.use(require('./fake-latency').simulateLatency());
    }

    // Mounts the SDC clients to req.sdc
    config.log = log;
    var sdcClients = require('./sdc-clients').createClients(config);
    var self = this;

    sdcClients.on('morayReady', function morayReady(morayClient) {
        morayClient.log.info('Moray Connection Ready');
        notes.createNotesBucket(morayClient);
        settings.createSettingsBucket(morayClient);

        self.sessions = Sessions.createSessions({
            moray: morayClient,
            log: log.child({
                component: 'sessions'
            })
        });
    });



    server.use(sdcClients.handler);

    server.use((function attachOtherClients(req, res, next) {
        req.adminUuid = config.adminUuid;
        req.sessions = this.sessions;
        req.ufds = this.ufds;
        req.ufdsMaster = this.ufdsMaster;

        return next();
    }).bind(this));


    var auth = require('./auth');
    server.get('/api/auth', auth.requireAuth, auth.getAuth);
    server.post('/api/auth',
        resume,
        bodyParser,
        auth.authenticate);


    server.del('/api/auth', auth.signout);

    server.get({name: 'ping', path: '/api/ping'}, auth.optionalAuth, function ping(req, res, next) {
        if (req.session) {
            req.sessions.touch(req.session.token);
        }
        res.end('');
        return next(false);
    });

    var stats = require('./api/stats');
    server.get('/api/stats/all', auth.requireAuth, stats.allStats);
    // server.get('/api/stats/vm_count', auth.requireAuth, stats.vmCount);
    // server.get('/api/stats/server_count', auth.requireAuth, stats.serverCount);
    // server.get('/api/stats/server_memory', auth.requireAuth, stats.serverMemory);

    var datacenters = require('./datacenters');
    server.get(
        {name: 'listDatacenters', path: '/api/datacenters'},
        auth.requireAuth,
        datacenters.listDatacenters);

    var vms = require('./vms');
    server.get(
        {name: 'listVMs', path: '/api/vms'},
        auth.requireAuth,
        vms.list);

    server.post(
        {name: 'createVM', path: '/api/vms'},
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.create);

    server.get('/api/vms/groupedByCustomer', auth.requireAuth, vms.groupedByCustomer);
    server.get('/api/vms/:uuid', auth.requireAuth, vms.get);

    server.post('/api/vms/:uuid', auth.requireAuth,
        resume,
        bodyParser,
        vms.action);

    server.put('/api/vms/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.update);

    server.patch('/api/vms/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.update);

    server.put('/api/vms/:uuid/tags',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.updateTags);

    server.put('/api/vms/:uuid/customer_metadata',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.updateCustomerMetadata);

    server.del('/api/vms/:uuid', auth.requireAuth,
        auth.requireAuth,
        auth.requireRole('operators'),
        vms.del);


    var jobs = require('./jobs');
    server.get('/api/jobs', auth.requireAuth, jobs.listJobs);
    server.get('/api/jobs/:uuid', auth.requireAuth, jobs.getJob);
    server.get('/api/jobs/:uuid/info', auth.requireAuth, jobs.getJobInfo);
    server.post('/api/jobs/:uuid/cancel', auth.requireAuth, jobs.cancelJob);


    var images = require('./images');
    server.patch('/api/images/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        images.update);

    server.put('/api/images/:uuid/file',
        auth.requireAuth,
        auth.requireRole('operators'),
        images.uploadImage);

    server.get('/api/images', auth.requireAuth, images.list);
    server.get('/api/images/:uuid', auth.requireAuth, images.get);

    server.post('/api/images/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        images.action);


    server.post('/api/images/:uuid/acl',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        images.aclAction);




    var packages = require('./packages');
    server.get('/api/packages', auth.requireAuth, packages.list);
    server.get('/api/packages/:uuid', auth.requireAuth, packages.get);
    server.post('/api/packages',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        packages.add);

    server.patch('/api/packages/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        packages.update);

    var platforms = require('./platforms');
    server.get('/api/platforms', auth.requireAuth, platforms.list);


    var servers = require('./servers');
    server.get('/api/boot/:uuid', auth.requireAuth, servers.getBootParams);
    server.post('/api/boot/:uuid', auth.requireAuth,
        auth.requireRole('operators'), resume, bodyParser, servers.setBootParams);

    server.get('/api/servers', auth.requireAuth, servers.list);
    server.get('/api/servers/:uuid', auth.requireAuth, servers.get);

    server.patch('/api/servers/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        servers.update);

    server.del('/api/servers/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        servers.del);

    server.post('/api/servers/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        function (req, res, next) {
        if (!req.params.action) {
            res.send(new restify.InvalidArgumentError('No Action Supplied'));
            return next();
        }

        if (req.params.action === 'setup') {
            return servers.setup(req, res, next);
        }

        if (req.params.action === 'update-nics') {
            return servers.updateNics(req, res, next);
        }

        if (req.params.action === 'factory-reset') {
            return servers.factoryReset(req, res, next);
        }

        if (req.params.action === 'reboot') {
            return servers.reboot(req, res, next);
        }

        res.send(new restify.InvalidArgumentError('Unsupported action'));
        return next();
    });

    server.get('/api/settings',
        auth.requireAuth,
        settings.getSettings);

    server.post('/api/settings',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        settings.saveSettings);

    server.get('/api/notes/:item_uuid', auth.requireAuth, notes.getNotes);

    server.post('/api/notes/:item_uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        notes.create);

    server.put('/api/notes/:item_uuid/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        notes.update);


    var networks = require('./networks');
    server.get('/api/networks', auth.requireAuth, networks.list);
    server.get('/api/networks/:uuid', auth.requireAuth, networks.get);

    server.post('/api/networks',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.create);

    server.put('/api/networks/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.update);

    server.del('/api/networks/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        networks.deleteNetwork);

    server.get('/api/networks/:uuid/ips',
        auth.requireAuth,
        networks.listIPs);

    server.patch('/api/networks/:uuid/ips/:ip',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.updateIP);

    server.get('/api/linkaggrs', auth.requireAuth, networks.listAggregations);
    server.post('/api/linkaggrs', auth.requireAuth, resume, bodyParser, networks.createAggregation);
    server.put('/api/linkaggrs/:id', auth.requireAuth, resume, bodyParser, networks.updateAggregation);
    server.del('/api/linkaggrs/:id', auth.requireAuth, networks.deleteAggregation);

    server.get('/api/nics', auth.requireAuth, networks.listNics);
    server.get('/api/nic_tags',
       auth.requireAuth,
       networks.listNicTags);

    server.get('/api/nic_tags/:uuid',
       auth.requireAuth,
       networks.getNicTag);

    server.get('/api/nic_tags/:uuid/servers',
       auth.requireAuth,
       networks.listServersWithNicTag);

    server.post('/api/nic_tags',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.createNicTag);

    var networkPools = require('./network_pools');
    server.get('/api/network_pools', auth.requireAuth, networkPools.listNetworkPools);
    server.get('/api/network_pools/:uuid', auth.requireAuth, networkPools.getNetworkPool);

    server.post('/api/network_pools',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networkPools.createNetworkPool);

    server.put('/api/network_pools/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networkPools.updateNetworkPool);

    server.del('/api/network_pools/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        networkPools.deleteNetworkPool);

    var firewall = require('./firewall');

    server.get('/api/fw/rules',
        auth.requireAuth,
        firewall.listRules);

    server.get('/api/fw/rules/:uuid',
        auth.requireAuth,
        firewall.getRule);

    server.post('/api/fw/rules',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        firewall.createRule);

    server.put('/api/fw/rules/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        firewall.updateRule);

    server.del('/api/fw/rules/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        firewall.deleteRule);

    var users = require('./users');
    server.get('/api/users', auth.requireAuth, users.list);

    server.post('/api/users',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.create);

    server.get('/api/users/count', auth.requireAuth, users.countUsers);

    server.get('/api/users/:uuid/roles', auth.requireAuth, users.listRoles);
    server.post('/api/users/:uuid/roles',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.addRole);

    server.put('/api/users/:uuid/roles/:role',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.modifyRole);

    server.del('/api/users/:uuid/roles/:role',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.deleteRole);

    server.get('/api/users/:account/:uuid/roles', auth.requireAuth, users.listSubuserRoles);

    server.get('/api/users/:uuid/limits', auth.requireAuth, users.getLimits);

    server.post('/api/users/:uuid/limits/:datacenter',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.addLimit);

    server.patch('/api/users/:uuid/limits/:datacenter',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.updateLimit);

    server.del('/api/users/:uuid/limits/:datacenter',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.deleteLimit);



    server.get('/api/users/:uuid/policies',
        auth.requireAuth,
        users.listPolicies);

    server.get('/api/users/:uuid/policies/:policy',
        auth.requireAuth,
        users.getPolicy);

    server.post('/api/users/:uuid/policies',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.addPolicy);

    server.put('/api/users/:uuid/policies/:policy',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.modifyPolicy);

    server.del('/api/users/:uuid/policies/:policy',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.deletePolicy);

    server.get('/api/users/:account/:uuid/keys',
        auth.requireAuth,
        users.listKeys);

    server.post('/api/users/:account/:uuid/keys',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.addKey);

    server.del('/api/users/:account/:uuid/keys/:fingerprint',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.deleteKey);

    server.get('/api/users/:uuid/keys',
        auth.requireAuth,
        users.listKeys);

    server.post('/api/users/:uuid/keys',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.addKey);

    server.del('/api/users/:uuid/keys/:fingerprint',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.deleteKey);

    server.get('/api/users/:uuid/2fa',
        auth.requireAuth,
        users.getTwoFactorAuthStatus);

    server.patch('/api/users/:uuid/2fa',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.disableTwoFactorAuth);

    server.post('/api/users/:uuid/unlock',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.unlockUser);

    server.get('/api/users/:uuid',
        auth.requireAuth,
        users.get);

    server.get('/api/users/:account/:uuid',
        auth.requireAuth,
        users.get);

    server.patch('/api/users/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume, bodyParser, users.update);

    server.patch('/api/users/:account/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume, bodyParser, users.update);

    server.del('/api/users/:account/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.deleteUser);


    var services = require('./services');
    server.get('/api/services', auth.requireAuth, services.listServices);
    server.get('/api/applications', auth.requireAuth, services.listApplications);
    server.get('/api/instances', auth.requireAuth, services.listInstances);


    require('./api/manta').mount(server, [auth.requireAuth]);

    var amon = require('./amon');
    server.post('/api/amon/probes',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        amon.createProbe);

    server.get('/api/amon/probes', auth.requireAuth, amon.listProbes);
    server.get('/api/amon/probes/:user/:uuid', auth.requireAuth, amon.getProbe);

    server.del('/api/amon/probes/:user/:uuid', auth.requireAuth,
        auth.requireRole('operators'),
        amon.deleteProbe);

    server.get('/api/amon/probegroups/:user', auth.requireAuth, amon.listProbeGroups);
    server.get('/api/amon/probegroups/:user/:uuid', auth.requireAuth, amon.getProbeGroup);

    server.get('/api/amon/alarms',
        auth.requireAuth,
        amon.listAlarms);

    server.get('/api/amon/alarms/:user/:uuid',
        auth.requireAuth,
        amon.getAlarm);

    server.post('/api/amon/alarms/:user/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        amon.alarmAction);

    server.get({ name: 'fishbulb/index', path: '/fishbulb' },
        function fishbulbIndex(req, res, next) {

        res.setHeader('content-type', 'text/html');
        var file = path.join(server.root, 'www', 'fishbulb', 'index.htm');
        fs.readFile(file, function doneReadFile(err, f) {
            req.log.info('done');
            if (err) {
                return next(err);
            }
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(f);
            return next(false);
        });
    });

    server.get({ name: 'fishbulb', path: new RegExp('/fishbulb\/?.*')},
        restify.serveStatic({ directory: './www', 'default': 'index.htm' }));

    caproxy.setup(config);
    caproxy.mount(server, [auth.requireAuth, resume, bodyParser]);

    /* Static Files */
    var assets = require('./assets');

    server.get({
        name: 'index',
        path: '/'
    }, function indexPage(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
    }, assets.index(this));

    server.get('/app.css', assets.less);
    server.get('/app.js', assets.preFile(this), restify.conditionalRequest(), assets.file(this));
    server.get('/libs.js', assets.preFile(this), restify.conditionalRequest(), assets.file(this));

    server.get({
        name: 'asset',
        path: /^\/(font|img|css|js|favicon\.ico).*$/
    },
    assets.preFile(this),
    restify.conditionalRequest(),
    assets.file(this));

    server.get({
        name: 'catchall',
        path: /\/(?!api)\w+/
    }, function catchAll(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        next();
    }, assets.index(this));

    var auditLogger = require('./audit');

    server.on('after', auditLogger({ log: log }));

    server.on('uncaughtException', function (req, res, route, error) {
        log.fatal(error, 'adminui uncaught exception', {route: route});
        res.send(error);
    });


    return server;
};


ADMINUI.prototype.listen = function (callback) {
    var adminui = this;

    this.httpsEnforcer.listen(this.config.port, this.config.host, function () {
        adminui.log.info('HTTP Server started on %s:%s',
            adminui.httpsEnforcer.address().address,
            adminui.httpsEnforcer.address().port);
    });

    this.server.listen(this.config.sslport, this.config.host, function () {
        adminui.log.info('HTTPS Server started on %s:%s',
            adminui.server.address().address,
            adminui.server.address().port);
    });

    if (typeof (callback) === 'function') {
        callback(this);
    }
};

module.exports = {
    ADMINUI: ADMINUI,
    createServer: function (options) {
        return new ADMINUI(options);
    }
};
