var path = require('path');
var assert = require('assert');
var fs = require('fs');


function loadConfig(file) {
  assert.ok(file);

  var _f = fs.readFileSync(file, 'utf8');
  return JSON.parse(_f);
}

var log = require('bunyan').createLogger({
  name: 'adminui',
  level: 'info'
});


var cfgFile = path.join(__dirname, '/etc/config.json');
var cfg = loadConfig(cfgFile);

var adminui = require('./lib/adminui').createServer({
  config: cfg,
  log: log
});

adminui.listen();

process.on('uncaughtException', function(e) {
  log.fatal(e);
});

