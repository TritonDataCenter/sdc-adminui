var path = require('path');
var assert = require('assert');
var fs = require('fs');
var restify = require('restify');


function loadConfig(file) {
    assert.ok(file);

    var _f = fs.readFileSync(file, 'utf8');
    return JSON.parse(_f);
}

var log = require('bunyan').createLogger({
    name: 'adminui',
    level: 'info',
    serializers: restify.bunyan.serializers
});


var cfgFile = path.join(__dirname, '/etc/config.json');
var cfg = loadConfig(cfgFile);

log.info('Initializing AdminUI');
var adminui = require('./lib/adminui').createServer({
    config: cfg,
    log: log,
    version: require('./package.json').version
});

adminui.listen(function() {
    log.info('Ready to rock!');
});

process.on('uncaughtException', function preventOtherError(e) {
    if (e && e.name && e.name === 'OtherError' &&
        /request\stimeout/.test(e.message)) {
        return;
    } else {
        throw e;
    }
});
