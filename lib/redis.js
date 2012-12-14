var redis = require('redis');
var assert = require('assert');

module.exports = {
    createClient: function(config) {
        assert.ok(config.host, 'config.host required');

        var log = config.log;
        var client = redis.createClient(config.port, config.host, {
            retry_backoff: 2
        });
        var db = config.db;
        log.info('Establishing connection to redis');

        if(typeof(db) !== 'undefined') {
            log.debug('selecting database', config.db);
            client.select(db, function() {
                log.debug('select database: done');
            });
        }

        client.on('error', function(err) {
            log.fatal('Redis Client Error', err);
        });

        client.on('ready', function() {
            log.info('Redis Client Ready');
        });

        client.on('end', function() {
            log.info('Redis Connection Closed');
        });

        return client;
    }
};