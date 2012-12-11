var stitch = require('stitch');
var path = require('path');
var filed = require('filed');
var less = require('less');
var fs = require('fs');
var restify = require('restify');

module.exports = {
  js: function(server) {
    var libdir = server.root + '/public/js/lib/';
    var deps = [
      libdir + 'jquery.js',
      libdir + 'jquery.serializeObject.js',
      libdir + 'underscore.js',
      libdir + 'underscore.string.js',
      libdir + 'backbone.js',
      libdir + 'handlebars.js',
      libdir + 'sockjs-0.3.js',
      libdir + 'bootstrap.js',
      libdir + 'kevinykchan-bootstrap-typeahead.js'
    ];

    var pkg = stitch.createPackage({
      dependencies: deps,
      paths: [server.root + '/public/js']
    });

    return pkg.createServer();
  },

  index: function(server) {
    return function(req, res, next) {
      var f = filed(path.join(server.root, 'views/index.html'));

      if (req.headers['accept'].indexOf('text/html') !== -1) {
        f.pipe(res);
        f.on('end', function() {
          next(false);
        });
      } else {
        return next();
      }
    };
  },

  less: function (req, res, next) {
    var parser = new(less.Parser)({
      paths: [
        path.resolve(__dirname, '..', 'less'),
        path.resolve(__dirname, '..', 'bootstrap', 'less')
      ],
      filename: 'main.less'
    });

    var lessFilePath = path.join(__dirname , '..', 'less', 'app.less');
    var lessContents = fs.readFileSync(lessFilePath, 'ascii');


    parser.parse(lessContents, function(err, tree) {
      if (err) {
        req.log.fatal("Less Parser Error", err);
        return next(new restify.Error(err));
      }

      try {
        var css = tree.toCSS();
        res.writeHead(200, {
          'Content-Length': Buffer.byteLength(css),
          'Content-Type': 'text/css'
        });

        res.write(css);
        res.end();
      } catch (ex) {
        req.log.fatal(ex);
        return next(new restify.InternalError(ex));
      }
    });
  },

  file: function(server, file) {
    return function(req, res, next) {
      var p;
      if (typeof(file) === 'undefined') {
        p = path.join(server.root, 'public', req.path);
      } else {
        p = path.join(server.root, 'public', file);
      }
      var f = filed(p);
      f.pipe(res);
      f.on('end', function() {
        next(false);
      });
    };
  }
};