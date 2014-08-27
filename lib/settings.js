/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var ADMINUI_BUCKET = 'adminui'
var ADMINUI_BUCKET_CFG = {
    index: {
        key: { type: "string", unique: false },
        value: { type: "string", unique: false }
    },
    pre: []
};

function createSettingsBucket(client) {
    function onBucketReady() {
        client.log.info('adminui bucket OK');
        client.getObject(ADMINUI_BUCKET, 'settings', function(err) {
            if (err) {
                if (err.name === 'ObjectNotFoundError') {
                    client.putObject(ADMINUI_BUCKET, 'settings', {}, function(err, obj) {
                        if (err) {
                            client.log.info('error adding settings key');
                            return;
                        }
                        client.log.info('added key: settings');
                    });
                }
            } else {
                client.log.info('settings key OK');
            }
        });
    }

    client.log.info('Checking moray for adminui bucket');
    client.getBucket(ADMINUI_BUCKET, function(err) {
        if (err) {
            if (err.name === 'BucketNotFoundError') {
                client.log.info('adminui moray bucket not found, creating...');
                client.createBucket(ADMINUI_BUCKET, ADMINUI_BUCKET_CFG, function(err) {
                    if (err) {
                        client.log.fatal(err, 'error creating settings bucket: %s', err.message);
                        return;
                    }
                    onBucketReady();
                });
                return;
            }
            client.log.fatal(err, 'error retrieving settings bucket from moray');
            return;
        } else {
            onBucketReady();
        }
    });
}



module.exports = {
    createSettingsBucket: createSettingsBucket,
    /**
     * available settings
     *
     * provision.preset_networks
     * provision.preset_primary_network
     */
    getSettings: function(req, res, next) {
        req.sdc[req.dc].moray.getObject(ADMINUI_BUCKET,
            'settings',
            {noCache: true },
            function(err, obj)
            {
            res.send(obj.value);
        });
    },
    saveSettings: function(req, res, next) {
        var body = req.body;
        req.sdc[req.dc].moray.putObject(ADMINUI_BUCKET, 'settings', body, function(err, obj) {
            if (err) {
                req.log.error('error saving settings', err);
                return next(err);
            }

            res.send(body);
        });
    }
}
