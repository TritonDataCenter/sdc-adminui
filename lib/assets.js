var path = require('path');
var filed = require('filed');
var less = require('less');
var fs = require('fs');
var restify = require('restify');
var url = require('url');

module.exports = {
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
      var pathname = url.parse(req.url).pathname;
      if (typeof(file) === 'undefined') {
        p = path.join(server.root, 'public', pathname);
      } else {
        p = path.join(server.root, 'public', file);
      }
      var f = filed(p);
      req.pipe(filed(p)).pipe(res);
    };
  }
};
