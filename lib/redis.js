var redis = require('redis');
var assert = require('assert');

module.exports = {
  createClient: function(config) {
    assert.ok(config.host, 'config.host required');

    var log = config.log;
    var client = require('redis').createClient(config.port, config.host);
    var db = config.db;

    if (typeof(db) !== 'undefined') {
      log.debug('selecting database', config.db);
      client.select(db, function() {
        log.debug('select database: done');
      });
    }

    client.on('error', function(err) {
      log.fatal('Redis Client Error', err);
    });

    return client;
  }
}

