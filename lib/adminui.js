var fs = require('fs');
var path = require('path');
var assert = require('assert');
var util = require('util');
var fmt = util.format;

var restify = require('restify');
var stitch = require('stitch');
var filed = require('filed');
var _ = require('underscore');

var EventEmitter = require('events').EventEmitter;



var ADMINUI = function(options) {
  EventEmitter.call(this);

  this.root = path.join(__dirname, '..');

  this.config = options.config;
  this.log = options.log;

  this.httpsEnforcer = require('./https-enforcer').createServer(this.config.sslport);

  this.redis = require('./redis').createClient({
    host: this.config.redis.host,
    port: this.config.redis.port,
    log: this.log.child({component:'redis'})
  });

  this.sessions = require('./sessions').createSessions({
    redis: this.redis,
    log: this.log.child({ component: 'sessions' })
  });

  this.server = this.createServer();
}

util.inherits(ADMINUI, EventEmitter);


ADMINUI.prototype.createServer = function() {
  var config = this.config;
  var log = this.log;

  assert.ok(config.ssl.certificate, 'ssl certificate required');
  assert.ok(config.ssl.key, 'ssl keyfile required');

  var cert = fs.readFileSync(config.ssl.certificate, 'ascii');
  var key = fs.readFileSync(config.ssl.key, 'ascii');

  var server = restify.createServer({
    name:'adminui',
    log: log,
    certificate: cert,
    key: key
  });

  server.use(restify.bodyParser());
  server.use(restify.queryParser());

  config.simulateLatency && server.use(require('./fake-latency').simulateLatency());

  // Mounts the SDC clients to req.sdc
  server.use(require('./sdc-clients').sdc(config));

  server.use((function(req, res, next) {
    req.redis = this.redis;
    req.sessions = this.sessions;

    return next();
  }).bind(this));


  var auth = require('./auth');
  server.get("/_/auth", auth.requireAuth, auth.getAuth);
  server.post("/_/auth", auth.authenticate);
  server.del("/_/auth", auth.requireAuth, auth.signout);

  server.get('/_/ping', auth.optionalAuth, function(req, res, next) {
    if (req.session) {
      req.sessions.touch(req.session.token);
    }
    return res.send('');
  });

  var vms = require('./vms');
  server.get("/_/vms", auth.requireAuth, vms.list);
  server.post('/_/vms', auth.requireAuth, vms.create);
  server.get("/_/vms/:uuid", auth.requireAuth, vms.get);
  server.post("/_/vms/:uuid", auth.requireAuth, vms.action);
  server.del('/_/vms/:uuid', auth.requireAuth, vms.delete);
  server.get('/_/jobs/:uuid', auth.requireAuth, vms.getJob);

  var images = require('./images');
  server.get("/_/images", auth.requireAuth, images.list);
  server.get("/_/images/:uuid", auth.requireAuth, images.get);

  var servers = require('./servers');
  server.get('/_/servers', auth.requireAuth, servers.list);
  server.get('/_/servers/:uuid', auth.requireAuth, servers.get);
  server.post('/_/servers/:uuid', auth.requireAuth, function(req, res, next) {
    if (req.params.action) {
      return next();
    } else {
      res.send(new restify.InvalidArgumentError('No action supplied'));
    }
  }, servers.setup);

  var networks = require('./networks');
  server.get('/_/networks', auth.requireAuth, networks.list)

  var users = require('./users');
  server.get('/_/users', auth.requireAuth, users.list);
  server.get('/_/users/:login', auth.requireAuth, users.get);

  server.get("/", function(req, res, next) {
    req.pipe(filed(path.join(server.root, 'views/index.html'))).pipe(res);
  });





  /* Static Files */
  var assets = require('./assets');
  server.get('/app.js', assets.js(this));
  server.get('/app.css', assets.less);
  server.get(/^\/(img|css|js|favicon\.ico).*$/, assets.file(this));
  server.get(/\/.*/, assets.index(this));
  server.on('after', restify.auditLogger({ log: log.child({component:'audit'}) }));

  server.on('uncaughtException', function (req, res, route, err) {
    req.log.fatal(err.message, {
      params: req.params,
      route: route.name
    });

    return res.send(new restify.InternalError);
  });

  return server;
}

ADMINUI.prototype.listen = function(callback) {
  var adminui = this;

  this.httpsEnforcer.listen(this.config.port, this.config.host, function() {
    adminui.log.info('HTTP Server started on %s:%s',
             adminui.httpsEnforcer.address().address,
             adminui.httpsEnforcer.address().port
            );
  });
  this.server.listen(this.config.sslport, this.config.host, function() {
    adminui.log.info('HTTPS Server started on %s:%s',
             adminui.server.address().address,
             adminui.server.address().port
            );
  });

  typeof(callback) === 'function' && callback(this);
}

module.exports = {
  ADMINUI: ADMINUI,
  createServer: function (options) {
    return new ADMINUI(options);
  }
};
