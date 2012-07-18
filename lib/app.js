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

    var pkg = stitch.createPackage({
      paths: [server.root + '/public/js'],
      dependencies: [
        server.root + '/public/js/lib/jquery.js',
        server.root + '/public/js/lib/jquery.serializeObject.js',
        server.root + '/public/js/lib/underscore.js',
        server.root + '/public/js/lib/underscore.string.js',
        server.root + '/public/js/lib/backbone.js',
        server.root + '/public/js/lib/handlebars.js',
        server.root + '/public/js/lib/bootstrap.js',
        server.root + '/public/js/lib/kevinykchan-bootstrap-typeahead.js'
      ]
    });

    server.use(function(req, res, next) {
      req.log = log;
      return next();
    });

    server.use(restify.bodyParser());
    server.use(restify.queryParser());

    if (config.simulateLatency === true) {
      server.use(function(req, res, next) {
        if (req.path.indexOf('/_/') !== -1) {
          setTimeout(function() {
            return next();
          }, Math.floor((Math.random() * 150) + 50));
        } else {
          return next();
        }
      });
    }

    server.get('/app.css', function(req, res, next) {
      var parser = new(less.Parser)({
        paths: [
          path.resolve(__dirname, '..', 'less'),
          path.resolve(__dirname, '..', 'bootstrap', 'less'),
        ],
        filename: 'main.less'
      });

      parser.parse(
        fs.readFileSync( path.join(__dirname, '..', 'less', 'app.less'), 'ascii'),
        function(err, tree) {
          if (err) {
            log.fatal("Less Parser Error", err);
            return next(new restify.Error(err));
          }

          res.contentType = 'text/css';
          res.end(tree.toCSS());
        });
    });

    // Mounts the SDC clients to req.sdc
    server.use(require('./sdc-clients').sdc(config));

    var auth = require('./auth');
    server.get("/_/auth", auth.checkAuth);
    server.post("/_/auth", auth.authenticate);
    server.del("/_/auth", auth.signout);

    var vms = require('./vms');
    server.get("/_/vms", vms.list);
    server.post('/_/vms', vms.create);
    server.get("/_/vms/:uuid", vms.get);
    server.post("/_/vms/:uuid", vms.action);

    server.get('/_/jobs/:uuid', vms.getJob);

    var images = require('./images')
    server.get("/_/images", images.list);
    server.get("/_/images/:uuid", images.get);

    var servers = require('./servers');
    server.get('/_/servers', servers.list);
    server.get('/_/servers/:uuid', servers.get);

    var networks = require('./networks');
    server.get('/_/networks', networks.list)

    var users = require('./users');
    server.get('/_/users', users.list);
    server.get('/_/users/:login', users.get);

    server.get("/", function(req, res, next) {
      req.pipe(
        filed(path.join(server.root, 'views/index.html'))
      ).pipe(res)
    });















    server.get('/app.js', pkg.createServer());

    /* JSSTYLED */
    server.get(/^\/(img|css|js|favicon\.ico).*$/, function(req, res, next) {
      var p = path.join(server.root, 'public', req.path)
      req.log.debug("%s -> %s", req.path, p);

      var f = filed(p);
      f.pipe(res);
      f.on('end', function() {
        next(false);
      });
    });

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

    server.on('after', restify.auditLogger({ log: log }));

    server.on('uncaughtException', function (req, res, route, err) {
      req.log.error(err);
      return res.send(err);
    });

    server.start = function (cb) {
      server.listen(config.sslport, config.host, cb);
    };

    return server;
  }
};
