var stitch = require('stitch');
var path = require('path');
var filed = require('filed');

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
