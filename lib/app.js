var assert = require('assert');
var fs = require('fs');
var path = require('path');

var express = require('express');
var hbs = require('hbs');

var SDC = require('sdc-clients');


function createClients(options) {
  assert.ok(options);
  assert.ok(options.mapi);
  assert.ok(options.ufds);

  var ufds = new SDC.UFDS(options.ufds);

  ufds.on('error', function (err) {
    options.log.error(err);
  });


  var mapi = new SDC.MAPI(options.mapi);

  return {
    ufds: ufds,
    mapi: mapi
  };
}


module.exports = {

  createServer: function (options) {
    assert.ok(options.config, 'options.config file required');



    // Load configuration
    var config = (function () {
      var _f = fs.readFileSync(options.config, 'utf8');
      return JSON.parse(_f);
    })();


    var server = express.createServer();
    server.root = path.join(__dirname, '..');


    server.register('.html', hbs);
    server.set('views', path.join(server.root, 'views'));
    server.set('view engine', 'html');
    server.set('view options', { layout: false });


    server.configure(function () {
      server.use(express.bodyParser());
      server.use(express.logger('dev'));
    });

    server.configure('development', function () {
      server.use(
        express.static(path.join(server.root, 'public')),
        express.errorHandler({ dumpExceptions: true, showStack: true }));
    });


    server.clients = createClients(config);


    // === ATTACH SDC Client
    server.all(/.*/, function (req, res, next) {
      req.sdc = server.clients;
      next();
    });


    server.post('/auth', function (req, res) {
      console.log(req.body);
      req.sdc.ufds.authenticate(req.body.username, req.body.password, _cb);

      function _cb(err, user) {
        if (err) {
          res.send(err);
          return;
        }
        res.send(user);
      }
    });



    // ==== Routes
    server.get(/\/.*/, function (req, res) {
      res.render('index');
    });



    server.start = function (cb) {
      server.listen(config.port, config.host, cb);
    };

    return server;
  }
};
