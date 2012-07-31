var fs = require('fs');
var path = require('path');
var fmt = require('util').format;

var assert = require('assert');
var restify = require('restify');
var stitch = require('stitch');
var filed = require('filed');
var less = require('less');


module.exports = {

  createServer: function (options) {
    assert.ok(options.config, 'options.config file required');
    var config = options.config;
    var log = options.log;
    config.log = log;

    var httpServer = restify.createServer();
    function httpServerRedirect(req, res, next) {
      res.header('Location',
                 fmt("https://%s:%s%s", req.headers.host.split(':')[0],
                     config.sslport, req.url));
      res.send(302)
      return next(false);
    }

    httpServer.use(httpServerRedirect);
    httpServer.get(/.*/, function() {
      return res.redirect(fmt("https://%s%s}", req.headers.host, req.headers.url))
    });

    httpServer.listen(config.port);


    var cert = fs.readFileSync(config.ssl.certificate, 'ascii');
    var key = fs.readFileSync(config.ssl.key, 'ascii');

    var server = restify.createServer({
      log: log,
      certificate: cert,
      key: key
    });

    server.root = path.join(__dirname, '..');

    server.use(function(req, res, next) {
      req.log = log;
      return next();
    });

    server.use(restify.bodyParser());
    server.use(restify.queryParser());

    config.simulateLatency && server.use(require('./fake-latency').simulateLatency());

    server.get('/app.css', function(req, res, next) {
      var parser = new(less.Parser)({
        paths: [
          path.resolve(__dirname, '..', 'less'),
          path.resolve(__dirname, '..', 'bootstrap', 'less'),
        ],
        filename: 'main.less'
      });

      var lessFilePath = path.join(__dirname , '..', 'less', 'app.less');
      var lessContents = fs.readFileSync(lessFilePath, 'ascii');

      res.contentType = 'text/css';

      parser.parse(lessContents, function(err, tree) {
        if (err) {
          req.log.fatal("Less Parser Error", err);
          return next(new restify.Error(err));
        }

        try {
          var css = tree.toCSS();
          res.end(css);
        } catch (ex) {
          req.log.fatal(ex);
          return next(new restify.InternalError(ex));
        }
      });
    });

    // configure redis
    assert.ok(config.redis.host, 'config.redis.host required');
    var redis = require('redis').createClient(config.redis.port, config.redis.host);
    var redisLog = log.child({component:'redis'});

    if (typeof(config.redis.db) !== 'undefined') {
      redisLog.info('selecting database', config.redis.db);
      redis.select(config.redis.db, function() {
        redisLog.info('select database: done');
      });
    } else {
      redisLog.warn('using default db 0, this is probably bad');
    }

    redis.on('error', function(err) {
      redisLog.fatal('Redis Client Error', err);
    });

    server.use(function(req, res, next) {
      req.redis = redis;
      return next();
    });

    // Mounts the SDC clients to req.sdc
    server.use(require('./sdc-clients').sdc(config));


    var Sessions = require('./sessions');
    var sessions = new Sessions({
      redis: redis,
      log: log.child({component:sessions})
    });

    server.use(function(req, res, next) {
      req.sessions = sessions;
      return next();
    });

    var auth = require('./auth');
    server.get("/_/auth", auth.requireAuth, auth.getAuth);
    server.post("/_/auth", auth.authenticate);
    server.del("/_/auth", auth.requireAuth, auth.signout);

    server.get('/_/ping', auth.optionalAuth, function(req, res, next) {
      if (req.session) {
        req.sessions.touch(req.session.token);
      }
      return next();
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
    server.get('/app.js', assets.js(server));

    /* JSSTYLED */
    server.get(/^\/(img|css|js|favicon\.ico).*$/, assets.file(server));

    /* JSSTYLED */
    server.get(/\/.*/, function (req, res, next) {
      if (req.headers['accept'].indexOf('text/html') !== -1) {
        var f = filed(path.join(server.root, 'views/index.html'));
        f.pipe(res);
        f.on('end', function() {
          next(false);
        });
      }
    });

    server.on('after', restify.auditLogger({ log: log.child({component:'audit'}) }));

    server.on('uncaughtException', function (req, res, route, err) {
      req.log.fatal(err.message, {
        params: req.params,
        route: route.name
      });

      return res.send(new restify.InternalError);
    });

    server.start = function (cb) {
      server.listen(config.sslport, config.host, cb);
    };

    return server;
  }
};
