/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var ADMINUI_BUCKET = 'adminui';
var ADMINUI_BUCKET_CFG = {
    index: {
        key: { type: 'string', unique: false },
        value: { type: 'string', unique: false }
    },
    pre: []
};

function createSettingsBucket(client) {
    function onBucketReady() {
        client.log.info('adminui bucket OK');

        client.getObject(ADMINUI_BUCKET, 'settings', function (err) {
            if (err && err.name === 'ObjectNotFoundError') {
                client.putObject(ADMINUI_BUCKET, 'settings', {}, function (putErr, obj) {
                    if (putErr) {
                        client.log.info('error adding settings key');
                    } else {
                        client.log.info('added key: settings');
                    }
                    return null;
                });
                return null;
            }

            if (err) {
                client.log.info(err, 'error adding settings key');
                return null;
            }

            client.log.info('settings key OK');
            return null;
        });
    }

    client.log.info('Checking moray for adminui bucket');
    client.getBucket(ADMINUI_BUCKET, function (getErr) {
        if (getErr) {
            if (getErr.name === 'BucketNotFoundError') {
                client.log.info('adminui moray bucket not found, creating...');
                client.createBucket(ADMINUI_BUCKET, ADMINUI_BUCKET_CFG, function (createErr) {
                    if (createErr) {
                        client.log.fatal(createErr, 'error creating settings bucket: %s', createErr.message);
                        return null;
                    }
                    onBucketReady();
                    return null;
                });
                return null;
            }
            client.log.fatal(getErr, 'error retrieving settings bucket from moray');
        } else {
            onBucketReady();
        }
        return null;
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
    getSettings: function (req, res, next) {
        req.sdc[req.dc].moray.getObject(ADMINUI_BUCKET,
            'settings',
            {noCache: true },
            function (err, obj)
            {
            res.send(obj.value);
        });
    },
    saveSettings: function (req, res, next) {
        var body = req.body;
        req.sdc[req.dc].moray.putObject(ADMINUI_BUCKET, 'settings', body, function (err, obj) {
            if (err) {
                req.log.error('error saving settings', err);
                return next(err);
            }

            res.send(body);
            return next();
        });
    }
};
