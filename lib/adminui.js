var fs = require('fs');
var path = require('path');
var assert = require('assert');
var util = require('util');
var fmt = util.format;

var restify = require('restify');
var sockjs = require('sockjs');
var filed = require('filed');

var EventEmitter = require('events').EventEmitter;
var HttpsEnforcer = require('./https-enforcer');
var RedisClient = require('./redis');
var Sessions = require('./sessions');
var caproxy = require('./caproxy');

var notes = require('./notes');

function resume(req, res, next) {
    process.nextTick(function () {
        req.resume();
    });
    next();
}

var bodyParser = restify.bodyParser({mapParams: false});



var ADMINUI = function(options) {
    EventEmitter.call(this);
    var adminui = this;

    this.status = {};
    this.root = path.join(__dirname, '..');
    this.config = options.config;
    this.log = options.log;

    this.httpsEnforcer = HttpsEnforcer.createServer(this.config.sslport);

    this.redis = RedisClient.createClient({
        host: this.config.redis.host,
        port: this.config.redis.port,
        log: this.log.child({
            component: 'redis'
        })
    });

    this.redis.on('error', function(e) {
        adminui.status['redis'] = e.message;
    });


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

    assert.ok(config.ssl.certificate, 'ssl certificate required');
    assert.ok(config.ssl.key, 'ssl keyfile required');

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

    if (config.simulateLatency) {
        server.use(require('./fake-latency').simulateLatency());
    }

    // Mounts the SDC clients to req.sdc
    config.log = log;
    var sdcClients = require('./sdc-clients').createClients(config);

    sdcClients.on('ping', function(client, err, ping) {
        adminui.status[client] = {
            lastError: err,
            lastPing: ping
        };
    });

    sdcClients.on('morayReady', function(morayClient) {
        morayClient.log.info('ready');
        notes.createNotesBucket(morayClient);
    });

    server.use(sdcClients.handler);

    server.use((function(req, res, next) {
        req.redis = this.redis;
        req.sessions = this.sessions;

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
        res.send({});
        return next();
    });

    var stats = require('./stats');
    server.get("/_/stats/vm_count", auth.requireAuth, stats.vm_count);
    server.get("/_/stats/server_count", auth.requireAuth, stats.server_count);

    var vms = require('./vms');
    server.get("/_/vms", auth.requireAuth, vms.list);

    server.post('/_/vms',
        auth.requireAuth,
        resume,
        bodyParser,
        vms.create);

    server.get("/_/vms/:uuid", auth.requireAuth, vms.get);
    server.post("/_/vms/:uuid", auth.requireAuth,
        resume,
        bodyParser,
        vms.action);

    server.put("/_/vms/:uuid", auth.requireAuth, vms.update);
    server.put("/_/vms/:uuid/tags", auth.requireAuth, vms.updateTags);
    server.put("/_/vms/:uuid/customer_metadata", auth.requireAuth, vms.updateCustomerMetadata);

    server.del('/_/vms/:uuid', auth.requireAuth, vms.del);

    server.get('/_/jobs', auth.requireAuth, vms.listJobs);
    server.get('/_/jobs/:uuid', auth.requireAuth, vms.getJob);

    var images = require('./images');
    server.put("/_/images/:uuid/file",
        auth.requireAuth,
        images.uploadImage);

    server.get("/_/images", auth.requireAuth, images.list);
    server.get("/_/images/:uuid", auth.requireAuth, images.get);
    server.post("/_/images/:uuid",
          auth.requireAuth,
          resume,
          bodyParser,
          images.action);

    var packages = require('./packages');
    server.get('/_/packages', auth.requireAuth, packages.list);
    server.post('/_/packages', auth.requireAuth, packages.add);
    server.put('/_/packages/:uuid', auth.requireAuth, packages.update);

    var servers = require('./servers');
    server.get('/_/servers', auth.requireAuth, servers.list);
    server.get('/_/servers/:uuid', auth.requireAuth, servers.get);
    server.put('/_/servers/:uuid', auth.requireAuth,
        resume,
        bodyParser,
        servers.update);

    server.post('/_/servers/:uuid', auth.requireAuth, function(req, res, next) {
        if (!req.params.action) {
            res.send(new restify.InvalidArgumentError('No Action Supplied'));
            return next();
        }

        if (req.params.action === 'setup') {
            return servers.setup(req, res, next);
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

    server.get('/_/notes/:item_uuid', auth.requireAuth, notes.getNotes);
    server.post('/_/notes/:item_uuid', auth.requireAuth, notes.create);


    var networks = require('./networks');
    server.get('/_/networks', auth.requireAuth, networks.list);
    server.get('/_/networks/:uuid', auth.requireAuth, networks.get);
    server.post('/_/networks', auth.requireAuth, networks.create);
    server.get('/_/networks/:uuid/ips', auth.requireAuth, networks.listIPs);
    server.get('/_/nic_tags', auth.requireAuth, networks.listNicTags);


    var users = require('./users');
    server.get('/_/users', auth.requireAuth, users.list);
    server.post('/_/users', auth.requireAuth, resume, bodyParser, users.create);
    server.get('/_/users/count', auth.requireAuth, users.count);
    server.get('/_/users/:login', auth.requireAuth, users.get);
    server.get('/_/users/:uuid/keys', auth.requireAuth, users.listKeys);
    server.post('/_/users/:uuid/keys', auth.requireAuth, resume, bodyParser, users.addKey);
    server.del('/_/users/:uuid/keys/:fingerprint', auth.requireAuth, users.deleteKey);


    var amon = require('./amon');
    server.post('/_/amon/probes', auth.requireAuth, resume, bodyParser, amon.createProbe);
    server.get('/_/amon/probes', auth.requireAuth, amon.listProbes);
    server.del('/_/amon/probes/:user/:uuid', auth.requireAuth, amon.deleteProbe);
    server.get('/_/amon/probegroups/:user', auth.requireAuth, amon.listProbeGroups);

    server.get('/_/amon/alarms', amon.listAlarms);


    server.get("/fishbulb", function(req, res, next) {
        req.log.info('hello');
        req.pipe(filed({
            path: path.join(server.root, 'public', 'fishbulb', 'index.htm'),
            mimetype: 'text/html'
        })).pipe(res);
    });

    server.get(/\/fishbulb\/\w+/, restify.serveStatic({directory: './public' }));

    server.get("/", function(req, res, next) {
        req.pipe(filed(path.join(server.root, 'views/index.html'))).pipe(res);
    });

    server.get(/\/ca-vis\/.*/, restify.serveStatic({
        directory: './public'
    }));
    caproxy.setup(config);
    caproxy.mount(server, [auth.requireAuth, resume, bodyParser]);

    /* Static Files */
    var assets = require('./assets');
    server.get('/app.css', assets.less);
    server.get('/test', assets.file(this, 'test/index.html'));
    server.get(/\/test\/.*/, assets.file(this));

    server.get(/^\/(img|css|js|tpl|favicon\.ico).*$/, assets.file(this));

    server.get(/\/\w+/, function(req, res, next) {
        req.log.info('catchall - '+ req.path());
        next();
    }, assets.index(this));

    server.on('after', restify.auditLogger({
        log: log,
        body: true
    }));

    server.on('uncaughtException', function(req, res, route, err) {
        req.log.fatal(err.message, {
            params: req.params,
            route: route.name
        });

        if (false === res.headersSent) {
            res.send(new restify.InternalError());
        }
    });

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