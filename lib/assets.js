var stitch = require('stitch');
var path = require('path');
var filed = require('filed');
var less = require('less');
var fs = require('fs');

module.exports = {
  js: function(server) {
    var deps = [
      server.root + '/public/js/lib/jquery.js',
      server.root + '/public/js/lib/jquery.serializeObject.js',
      server.root + '/public/js/lib/underscore.js',
      server.root + '/public/js/lib/underscore.string.js',
      server.root + '/public/js/lib/backbone.js',
      server.root + '/public/js/lib/handlebars.js',
      server.root + '/public/js/lib/bootstrap.js',
      server.root + '/public/js/lib/kevinykchan-bootstrap-typeahead.js'
    ];

    var pkg = stitch.createPackage({
      dependencies: deps,
      paths: [server.root + '/public/js'],
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
    }
  },

  less: function (req, res, next) {
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
  },

  file: function(server) {
    return function(req, res, next) {
      var p = path.join(server.root, 'public', req.path)
      var f = filed(p);
      f.pipe(res);
      f.on('end', function() {
        next(false);
      });
    }
  }
}
