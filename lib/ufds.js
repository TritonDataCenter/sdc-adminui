var sdc = require('sdc-clients');
var assert = require('assert-plus');
var _ = require('underscore');

module.exports = {
    createUfdsClient: function(config) {
        assert.object(config, 'ufds configuration required');

        var log = config.log;
        var ufds = new sdc.UFDS(config);

        log.info('Connecting to UFDS: ', config.url);

        // ufds client itself comes plenty of listeners to buble up
        // ldap client events. Let's sightly increase limits
        ufds.setMaxListeners(15);
        ufds.on('timeout', function (msg) {
            log.warn({message: msg},
                'UFDS client timeout (recycling)');
                // server.emit('uncaughtException', req, res, null,
                //    new restify.InternalError('Backend Timeout Error'));
            try {
                ufds.client.socket.destroy();
            } catch (e) {
                log.fatal({err: e}, 'could not destroy the timed out UFDS socket');
            }
        });

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
