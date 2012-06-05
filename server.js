var path = require('path');
var assert = require('assert');
var fs = require('fs');



function loadConfig(file) {
  assert.ok(file);

  var _f = fs.readFileSync(file, 'utf8');
  return JSON.parse(_f);
}

var cfgFile = path.join(__dirname, '/etc/config.json');
var server = require('./lib/app').createServer({
  config: loadConfig(cfgFile),
  log: console
});

server.start(function () {
  console.log('=== Server started on %s:%s',
    server.address().address,
    server.address().port);
});
