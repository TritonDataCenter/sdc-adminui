/*
 * demo.js: static-file node HTTP server for demos
 *
 * Usage: node cademo.js [[-P] server]
 *
 *    Sets up a web server on port 4124 for the CA demo.
 *
 *    If no server is specified, the demo uses a configuration service and
 *    aggregator on the same host as the demo.
 *
 *    If a server is specified with -P, the demo uses a configuration service
 *    and aggregator service on the hostname specified by "server".
 *
 *    If a server is specified but -P is not specified, the demo uses a
 *    proxy on "server" port 80 that is assumed to automatically vector to the
 *    appropriate service/port.
 */

var http = require('http');
var url = require('url');
var p = require('path');
var fs = require('fs');

var index = 'vis.html';
var cwd = __dirname;
var localPort = 4124;
var caVersion = 'ca/0.1.7';

if (process.argv.length != 3) {
  console.log("Usage: node demo.js SERVER[:PORT]");
  return;
}

var args = process.argv[2].split(':')
port = args[1] || 80
server = args[0]

http.createServer(function (req, res) {
	var uri = url.parse(req.url).pathname;
	var path;
	var filename;

	path = (uri == '/') ? index : uri;
	filename = p.join(cwd, path);
	
	var writeErr = function(rs) {
	  rs.writeHead(404);
	  rs.end();
  }

  var proxyResp = function(rq, rs) {
    var options = {
      host : server,
      port : port,
      path : rq.url,
      method : rq.method,
      headers : rq.headers
    };
    options.headers['X-API-Version'] = caVersion
    
    var proxyReq = http.request(options, function(proxyRes) {
      console.log(proxyRes.statusCode, rq.method, server + ':' + port + rq.url);
      proxyRes.pipe(rs);
    });
    rq.pipe(proxyReq);
  }

  var fileResp = function(rq, rs) {
  	fs.readFile(filename, function (err, file) {
  		if (err) {
  			writeErr(rs);
  			return;
  		}

  		res.writeHead(200);
  		res.end(file);
  	});
  }

  if (path.match(/.*(js|css|html|ico|png|jpg)/)) {
    fileResp(req, res);
  } else {
    // treat as API req.
    proxyResp(req, res);
  }
}).listen(localPort, function () {
	console.log('Using CA API version:', caVersion);
	console.log('Attaching to CA service at:', server + ':' + port);
	console.log('Demo started on:', "http://localhost:" + localPort);
});
