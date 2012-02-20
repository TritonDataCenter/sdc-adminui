var path = require('path');
var CFG = path.join(__dirname, '/etc/config.json');

var server = require('./lib/app').createServer({
  config: CFG,
  log: console
});

server.start(function () {
  console.log('=== Server started on %s:%s',
              server.address().address,
              server.address().port);
});
