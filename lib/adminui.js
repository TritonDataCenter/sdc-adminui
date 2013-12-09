var fs = require('fs');
var path = require('path');
var assert = require('assert-plus');
var util = require('util');

var restify = require('restify');
var sockjs = require('sockjs');
var filed = require('filed');

var EventEmitter = require('events').EventEmitter;
var HttpsEnforcer = require('./https-enforcer');
var RedisClient = require('./redis');
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

var ADMINUI = function(options) {
    EventEmitter.call(this);

    assert.object(options.config, 'options.config');
    assert.object(options.log, 'options.log');

    this.root = path.join(__dirname, '..');
    this.config = options.config;
    this.log = options.log;

    this.httpsEnforcer = HttpsEnforcer.createServer(this.config.sslport);

    this.redis = RedisClient.createClient({
        db: this.config.redis.db,
        host: this.config.redis.host,
        port: this.config.redis.port,
        log: this.log.child({
            component: 'redis'
        })
    });

    this.config.ufds.log = this.log.child({component: 'ufds'});
    this.ufds = require('./ufds').createUfdsClient(this.config.ufds);

    this.config.ufdsMaster.log = this.log.child({component: 'ufdsMaster'});
    this.config.ufdsMaster.master = true;
    this.ufdsMaster = require('./ufds').createUfdsClient(this.config.ufdsMaster);


    this.sessions = Sessions.createSessions({
        redis: this.redis,
        log: this.log.child({
            component: 'sessions'
        })
    });

    this.server = this.createServer();
    this.sock = this.createSock();
    this.sock.installHandlers(this.server.server);
};

util.inherits(ADMINUI, EventEmitter);

ADMINUI.prototype.createServer = function() {
    var adminui = this;

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

    sdcClients.on('morayReady', function(morayClient) {
        morayClient.log.info('Moray Connection Ready');
        notes.createNotesBucket(morayClient);
        settings.createSettingsBucket(morayClient);
    });

    server.use(sdcClients.handler);

    server.use((function(req, res, next) {
        req.adminUuid = config.adminUuid;
        req.redis = this.redis;
        req.sessions = this.sessions;
        req.ufds = this.ufds;
        req.ufdsMaster = this.ufdsMaster;

        return next();
    }).bind(this));

    var auth = require('./auth');
    server.get("/_/auth", auth.requireAuth, auth.getAuth);
    server.post("/_/auth",
        resume,
        bodyParser,
        auth.authenticate);

    server.del("/_/auth", auth.requireAuth, auth.signout);

    server.get('/_/ping', auth.optionalAuth, function(req, res, next) {
        if (req.session) {
            req.sessions.touch(req.session.token);
        }
        res.end('');
        return next(false);
    });

    var stats = require('./stats');
    server.get("/_/stats/vm_count", auth.requireAuth, stats.vmCount);
    server.get("/_/stats/server_count", auth.requireAuth, stats.serverCount);
    server.get("/_/stats/server_memory", auth.requireAuth, stats.serverMemory);

    var vms = require('./vms');
    server.get("/_/vms",
        auth.requireAuth,
        vms.list);

    server.post('/_/vms',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.create);

    server.get("/_/vms/:uuid", auth.requireAuth, vms.get);
    server.post("/_/vms/:uuid", auth.requireAuth,
        resume,
        bodyParser,
        vms.action);

    server.put("/_/vms/:uuid",
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.update);

    server.patch("/_/vms/:uuid",
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.update);

    server.put("/_/vms/:uuid/tags",
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.updateTags);

    server.put("/_/vms/:uuid/customer_metadata",
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        vms.updateCustomerMetadata);

    server.del('/_/vms/:uuid', auth.requireAuth,
        auth.requireAuth,
        auth.requireRole('operators'),
        vms.del);

    var jobs = require('./jobs');
    server.get('/_/jobs', auth.requireAuth, jobs.listJobs);
    server.get('/_/jobs/:uuid', auth.requireAuth, jobs.getJob);
    server.get('/_/jobs/:uuid/info', auth.requireAuth, jobs.getJobInfo);


    var images = require('./images');
    server.patch('/_/images/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        images.update);

    server.put("/_/images/:uuid/file",
        auth.requireAuth,
        auth.requireRole('operators'),
        images.uploadImage);

    server.get("/_/images", auth.requireAuth, images.list);
    server.get("/_/images/:uuid", auth.requireAuth, images.get);

    server.post("/_/images/:uuid",
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        images.action);





    var packages = require('./packages');
    server.get('/_/packages', auth.requireAuth, packages.list);
    server.get('/_/packages/:uuid', auth.requireAuth, packages.get);
    server.post('/_/packages',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        packages.add);

    server.patch('/_/packages/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        packages.update);

    var platforms = require('./platforms');
    server.get('/_/platforms', auth.requireAuth, platforms.list);


    var servers = require('./servers');
    server.get('/_/boot/:uuid', auth.requireAuth, servers.getBootParams);
    server.post('/_/boot/:uuid', auth.requireAuth,
        auth.requireRole('operators'), resume, bodyParser, servers.setBootParams);

    server.get('/_/servers', auth.requireAuth, servers.list);
    server.get('/_/servers/:uuid', auth.requireAuth, servers.get);

    server.patch('/_/servers/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        servers.update);

    server.del('/_/servers/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        servers.del);

    server.post('/_/servers/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        function(req, res, next) {
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

    server.get('/_/settings',
        auth.requireAuth,
        settings.getSettings
    );

    server.post('/_/settings',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        settings.saveSettings
    );

    server.get('/_/notes/:item_uuid', auth.requireAuth, notes.getNotes);

    server.post('/_/notes/:item_uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        notes.create);

    server.put('/_/notes/:item_uuid/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        notes.update);


    var networks = require('./networks');
    server.get('/_/networks', auth.requireAuth, networks.list);
    server.get('/_/networks/:uuid', auth.requireAuth, networks.get);

    server.post('/_/networks',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.create);

    server.put('/_/networks/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.update);

    server.del('/_/networks/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        networks.deleteNetwork);

    server.get('/_/networks/:uuid/ips',
        auth.requireAuth,
        networks.listIPs);

    server.patch('/_/networks/:uuid/ips/:ip',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networks.updateIP);

    server.get('/_/nics', auth.requireAuth, networks.listNics);
    server.get('/_/nic_tags', auth.requireAuth, networks.listNicTags);

    var networkPools = require('./network_pools');
    server.get('/_/network_pools', auth.requireAuth, networkPools.listNetworkPools);
    server.get('/_/network_pools/:uuid', auth.requireAuth, networkPools.getNetworkPool);

    server.post('/_/network_pools',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networkPools.createNetworkPool);

    server.put('/_/network_pools/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        networkPools.updateNetworkPool);

    server.del('/_/network_pools/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        networkPools.deleteNetworkPool);

    var firewall = require('./firewall');

    server.get('/_/fw/rules',
        auth.requireAuth,
        firewall.listRules);

    server.get('/_/fw/rules/:uuid',
        auth.requireAuth,
        firewall.getRule);

    server.post('/_/fw/rules',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        firewall.createRule);

    server.put('/_/fw/rules/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        firewall.updateRule);

    server.del('/_/fw/rules/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        firewall.deleteRule);

    var users = require('./users');
    server.get('/_/users', auth.requireAuth, users.list);

    server.post('/_/users',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.create);

    server.get('/_/users/count', auth.requireAuth, users.countUsers);
    server.get('/_/users/:uuid/2fa',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.getTwoFactorAuthStatus);

    server.patch('/_/users/:uuid/2fa',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume, bodyParser, users.updateTwoFactorAuthStatus);

    server.get('/_/users/:login', auth.requireAuth, users.get);

    server.patch('/_/users/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume, bodyParser, users.update);


    server.get('/_/users/:uuid/keys', auth.requireAuth, users.listKeys);

    server.post('/_/users/:uuid/keys',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume, bodyParser, users.addKey);

    server.del('/_/users/:uuid/keys/:fingerprint',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.deleteKey);

    server.get('/_/users/:uuid/limits', auth.requireAuth, users.getLimits);

    server.put('/_/users/:uuid/limits/:dataenter',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.addLimit);

    server.patch('/_/users/:uuid/limits/:datacenter',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        users.updateLimit);

    server.del('/_/users/:uuid/limits/:datacenter',
        auth.requireAuth,
        auth.requireRole('operators'),
        users.deleteLimit);

    var services = require('./services');
    server.get('/_/services', auth.requireAuth, services.listServices);
    server.get('/_/applications', auth.requireAuth, services.listApplications);
    server.get('/_/instances', auth.requireAuth, services.listInstances);


    var amon = require('./amon');
    server.post('/_/amon/probes',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        amon.createProbe);

    server.get('/_/amon/probes', auth.requireAuth, amon.listProbes);

    server.del('/_/amon/probes/:user/:uuid', auth.requireAuth,
        auth.requireRole('operators'),
        amon.deleteProbe);

    server.get('/_/amon/probegroups/:user', auth.requireAuth, amon.listProbeGroups);

    server.get('/_/amon/alarms',
        amon.listAlarms);

    server.get('/_/amon/alarms/:user/:uuid',
        auth.requireAuth,
        amon.getAlarm);

    server.post('/_/amon/alarms/:user/:uuid',
        auth.requireAuth,
        auth.requireRole('operators'),
        resume,
        bodyParser,
        amon.alarmAction);

    server.get({ name: 'fishbulb/index', path: '/fishbulb' }, function(req, res, next) {
        res.setHeader('content-type', 'text/html');
        fs.readFile(path.join(server.root, 'public/fishbulb/index.htm'), function(err, f) {
            if (err) {
                return next(err);
            }
            res.setHeader('Content-Type', 'text/html');
            res.writeHead(200);
            res.end(f);
            next();
        });
    });

    server.get({ name: 'fishbulb', path: /\/fishbulb\/?.*/ }, restify.serveStatic({
        directory: './public/fishbulb',
        'default': 'index.htm'
    }));

    server.get("/", function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        req.pipe(filed(path.join(server.root, 'views/index.html'))).pipe(res);
    });

    caproxy.setup(config);
    caproxy.mount(server, [auth.requireAuth, resume, bodyParser]);

    /* Static Files */
    var assets = require('./assets');
    server.get('/app.css', assets.less);
    server.get('/app.js', assets.file(this, 'app.js'));
    server.get('/test.*', restify.serveStatic({directory: './public', 'default': 'index.html'}));
    server.get(/\/test\/.*/, assets.file(this));

    server.get(/^\/(font|img|css|js|favicon\.ico).*$/, assets.file(this));

    server.get(/\/\w+/, function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        req.log.info('catchall - '+ req.path());
        next();
    }, assets.index(this));

    server.on('after', restify.auditLogger({
        log: log
    }));

    return server;
};

ADMINUI.prototype.createSock = function() {
    var sockLog = this.log.child({
        component: 'sock'
    });
    var sock = sockjs.createServer({
        prefix: '/!',
        log: (function(level, message) {
            sockLog[level].call(sockLog, message);
        })
    });

    sock.on('connection', function(c) {
        // sockLog.info('connected', c);
    });

    return sock;
};

ADMINUI.prototype.listen = function(callback) {
    var adminui = this;

    this.httpsEnforcer.listen(this.config.port, this.config.host, function() {
        adminui.log.info('HTTP Server started on %s:%s', adminui.httpsEnforcer.address().address, adminui.httpsEnforcer.address().port);
    });

    this.server.listen(this.config.sslport, this.config.host, function() {
        adminui.log.info('HTTPS Server started on %s:%s', adminui.server.address().address, adminui.server.address().port);
    });

    if (typeof(callback) === 'function') {
        callback(this);
    }
};

module.exports = {
    ADMINUI: ADMINUI,
    createServer: function(options) {
        return new ADMINUI(options);
    }
};
