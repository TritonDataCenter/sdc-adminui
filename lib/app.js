var assert = require('assert');
var fs = require('fs');
var path = require('path');

var express = require('express');
var stitch = require('stitch');

var sdc = require('./middleware').sdc;


var Session = require('connect').middleware.session.Session;
var Logger = require('bunyan');
var log = new Logger({name:'adminui'});



function loadConfig(file) {
  assert.ok(file);

  var _f = fs.readFileSync(file, 'utf8');
  return JSON.parse(_f);
}

module.exports = {

  createServer: function (options) {
    assert.ok(options.config, 'options.config file required');

    var config = loadConfig(options.config);
    config.log = log;

    var server = express.createServer();
    server.root = path.join(__dirname, '..');

    var pkg = stitch.createPackage({
      paths: [server.root + '/public/js'],
      dependencies: [
        server.root + '/public/js/lib/jquery.js',
        server.root + '/public/js/lib/underscore.js',
        server.root + '/public/js/lib/underscore.string.js',
        server.root + '/public/js/lib/backbone.js',
        server.root + '/public/js/lib/handlebars.js',
        server.root + '/public/js/lib/bootstrap.js'
      ]
    });

    if (typeof (config.cookiesecret) === 'undefined') {
      log.warn('*** No cookiesecret specified, using default.');
      config.cookiesecret = 'development';
    }

    //
    // === Configure view options
    //
    server.set('views', path.join(server.root, 'views'));
    server.set('view engine', 'html');
    server.set('view options', { layout: false });

    server.configure(function () {
      server.use(express.bodyParser());
      server.use(express.logger('dev'));
      server.use(express.cookieParser());
      server.use(express.session({
        key: 'adminui.sid',
        secret: config.cookiesecret
      }));

      // Mounts bunyan logger
      server.use(
        (function () {
          return function (req, res, next) {
            req.log = log;
            return next();
          };
        })());

      // Mounts the SDC clients to req.sdc
      server.use(sdc(config));
    });

    server.configure('development', function () {
      server.use(
        express.static(path.join(server.root, 'public')),
        express.errorHandler({ dumpExceptions: true, showStack: true }));
    });

    server.get('/application.js', pkg.createServer());

    require('./auth').mount(server);
    require('./datasets').mount(server);
    require('./users').mount(server);
    require('./servers').mount(server);
    require('./vms').mount(server);

    server.use(function (err, req, res, next) {
      if (err) {
        req.log.fatal(err);
        return res.json({errors: [err.message]}, 409);
      } else {
        log.info(err);
        return next();
      }
    });

    /* JSSTYLED */
    server.get(/^\/(?!img|css|favicon\.ico).*$/, function (req, res) {
      res.setHeader('content-type', 'text/html');
      res.sendfile('views/index.html');
    });


    server.start = function (cb) {
      server.listen(config.port, config.host, cb);
    };

    return server;
  }
};
