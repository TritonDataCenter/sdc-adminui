var assert = require('assert');
var fs = require('fs');
var path = require('path');

var express = require('express');
var stitch = require('stitch');

var hbs = require('hbs');
var sdc = require('./middleware').sdc;


var MemoryStore = express.session.MemoryStore;
var Session = require('connect').middleware.session.Session;

var parseCookie = require('connect').utils.parseCookie;
var sessionStore = new MemoryStore();



function loadConfig(file) {
  assert.ok(file);

  var _f = fs.readFileSync(file, 'utf8');
  return JSON.parse(_f);
}

module.exports = {

  createServer: function (options) {
    assert.ok(options.config, 'options.config file required');

    var config = loadConfig(options.config);
    var server = express.createServer();
    var io = require('socket.io').listen(server);

    io.set('authorization', function (data, accept) {
      if (data.headers.cookie) {
        data.cookie = parseCookie(data.headers.cookie);
        data.sessionID = data.cookie['adminui.sid'];

        sessionStore.get(data.sessionId, function (err, session) {
          if (err || !session) {
            return accept('Error', false);
          } else {
            data.session = new Session(data, session);
            return accept(null, true);
          }
        });
      } else {
        return accept('No cookie transmitted', false);
      }

      return accept(null, true);
    });

    io.sockets.on('connection', function (socket) {
      var hs = socket.handshake;

      socket.join(hs.sessionID);

      console.log('[WS] Connected ' + socket.handshake.sessionID);

      socket.on('disconnect', function () {
        console.log('[WS] Disconnected ' + hs.sessionID);
      });
    });

    server.root = path.join(__dirname, '..');


    var pkg = stitch.createPackage({
      paths: [server.root + '/public/js'],
      dependencies: [
        server.root + '/public/js/lib/jquery.js',
        server.root + '/public/js/lib/underscore.js',
        server.root + '/public/js/lib/backbone.js',
        server.root + '/public/js/lib/handlebars.js',
        server.root + '/public/js/lib/bootstrap.js'
      ]
    });

    if (typeof (config.cookiesecret) === 'undefined') {
      console.warn('*** No cookiesecret specified, using default.');
      config.cookiesecret = 'development';
    }

    //
    // === Configure view options
    //
    server.register('.html', hbs);
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

      // Mounts the SDC clients to req.sdc
      server.use(sdc(config));

      // Mounts the WS connection to req.ws // which will allow route
      // handlers to emit messages and events to the client // via websocket
      // via req.ws.emit('message')
      server.use(function (req, res, next) {
        req.ws = io.sockets.in(req.sessionID);
        next();
      });

    });

    server.configure('development', function () {
      server.use(
        express.static(path.join(server.root, 'public')),
        express.errorHandler({ dumpExceptions: true, showStack: true }));
    });


    server.get('/auth', function (req, res) {
      if (req.session.user) {
        res.send(req.session.user);
      } else {
        res.send({});
      }
    });


    server.post('/auth', function (req, res) {
      assert.ok(req.body.username);
      assert.ok(req.body.password);

      var user = req.body.username;
      var pass = req.body.password;

      req.sdc.ufds.authenticate(user, pass, function (err, u) {
        req.session.user = u;
        return res.send(err || u);
      });
    });





    server.del('/auth', function (req, res) {
      req.session.destroy();
      res.end('');
    });



    //
    // ==== Routes
    //



    server.get('/users/count', function (req, res) {
      var opts = {
        scope: 'one',
        attributes: ['*', 'memberof'],
        filter: '(objectclass=sdcperson)'
      };

      req.sdc.ufds.search('ou=users, o=smartdc', opts, function (err, users) {
        res.send({ count: users.length });
      });
    });

    server.get('/application.js', pkg.createServer());

    /* JSSTYLED */
    server.get(/^\/(?!img|css|js|favicon\.ico).*$/, function (req, res) {
      res.render('index');
    });


    server.start = function (cb) {
      server.listen(config.port, config.host, cb);
    };

    return server;
  }
};
