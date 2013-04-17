var redis = require('redis');
var assert = require('assert');

module.exports = {
    createClient: function(config) {
        assert.ok(config.host, 'config.host required');

        var log = config.log;
        var client = redis.createClient(config.port, config.host, {
            retry_backoff: 2
        });
        log.info('Connecting to redis');


        client.on('error', function(err) {
            log.fatal(err, 'Redis Client Error');
        });

        client.on('ready', function() {
            log.info('Redis Client Ready');
            var db = config.db;
            if (typeof(db) !== 'undefined') {
                log.info('Selecting database', db);
                client.select(db, function() {
                    log.info('Select database: done');
                });
            }
        });

        client.on('end', function() {
            log.info('Redis Connection Closed');
        });

        return client;
    }
};
