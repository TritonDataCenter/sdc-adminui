/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var path = require('path');
var assert = require('assert');
var fs = require('fs');
var restify = require('restify');


function loadConfig(file) {
    assert.ok(file);

    var _f = fs.readFileSync(file, 'utf8');
    return JSON.parse(_f);
}


var cfgFile = path.join(__dirname, '/etc/config.json');
var cfg = loadConfig(cfgFile);

var log = require('bunyan').createLogger({
    name: 'adminui',
    level: process.env.LOG || cfg.logLevel || 'info',
    serializers: restify.bunyan.serializers
});


log.info('Initializing AdminUI');
var adminui = require('./lib/adminui').createServer({
    config: cfg,
    log: log,
    version: require('./package.json').version
});

adminui.listen(function ready() {
    log.info('Ready to rock!');
});

process.on('uncaughtException', function preventOtherError(e) {
    log.fatal(e, 'Uncaught Exception');
});
