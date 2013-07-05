var sdc = require('sdc-clients');
var assert = require('assert-plus');
var _ = require('underscore');

module.exports = {
    createUfdsClient: function(options) {
        assert.object(options, 'ufds configuration required');

        var log = options.log;
        var ufds = new sdc.UFDS(options);

        log.info('Connecting to UFDS: ', options.url);

        ufds.once('connect', function() {
            ufds.removeAllListeners('error');

            ufds.on('connect', function() {
                log.info('UFDS Reconnected');
            });

            ufds.on('close', function() {
                log.info('UFDS Connection Closed');
            });

            ufds.on('error', function (err) {
                log.warn(err, 'UFDS: unexpected error occurred');
            });
        });

        ufds.on('error', function (err) {
            log.warn(err, 'UFDS: unexpected error occurred');
        });

        return ufds;

    }
};
