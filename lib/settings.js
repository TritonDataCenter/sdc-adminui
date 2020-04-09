/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
/*
 * Copyright 2020 Joyent, Inc.
 */

/* eslint-disable max-len */
var ADMINUI_BUCKET = 'adminui';
var ADMINUI_BUCKET_CFG = {
    index: {
        key: { type: 'string', unique: false },
        value: { type: 'string', unique: false }
    },
    pre: []
};
var vasync = require('vasync');
var verror = require('verror');
var _ = require('underscore');

function createSettingsBucket(client) {
    function onBucketReady() {
        client.log.info('adminui bucket OK');

        client.getObject(ADMINUI_BUCKET, 'settings', function (err) {
            if (err && verror.hasCauseWithName(err, 'ObjectNotFoundError')) {
                client.putObject(ADMINUI_BUCKET, 'settings', {}, function (putErr, obj) {
                    if (putErr) {
                        client.log.info('error adding settings key');
                    } else {
                        client.log.info('added key: settings');
                    }
                });
            }

            if (err) {
                client.log.info(err, 'error adding settings key');
            }

            client.log.info('settings key OK');
        });
    }

    client.log.info('Checking moray for adminui bucket');
    client.getBucket(ADMINUI_BUCKET, function (getErr) {
        if (getErr) {
            if (verror.hasCauseWithName(getErr, 'BucketNotFoundError')) {
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
     * ssl_key
     * ssl_certificate
     */
    getSettings: function (req, res, next) {
        var sapi = req.sdc[req.dc].sapi;
        var log = req.log;
        var results = [];
        function getSSLFromSapi(cb) {
            sapi.listServices({
                name:'adminui'
            }, function (listServicesErr, services) {
                if (listServicesErr) {
                    cb(listServicesErr);
                    return;
                }
                var adminui = services[0];
                log.debug(adminui, 'found service');
                sapi.getService(adminui.uuid, function (getServiceErr, svs) {
                    if (getServiceErr) {
                        cb(getServiceErr);
                        return;
                    }
                    var metadata = svs.metadata;
                    if (metadata.ssl_key && metadata.ssl_certificate) {
                        results.push({
                            ssl_certificate: metadata.ssl_certificate,
                            ssl_key: metadata.ssl_key
                        });
                    } else {
                        results.push({});
                    }
                    cb(null);
                });
            });
        }

        function getSettingsFromMoray(cb) {
            req.sdc[req.dc].moray.getObject(ADMINUI_BUCKET, 'settings', {
                noCache: true
            }, function (err, obj) {
                if (err) {
                    cb(err);
                    return;
                }
                results.push(obj.value);
                cb(null);
            });
        }

        vasync.parallel({
            funcs: [getSettingsFromMoray, getSSLFromSapi]
        }, function paraCb(err) {
            var obj = {};
            results.forEach(function (r) {
                _.extend(obj, r);
            });
            if (obj.ssl_key) {
                obj.ssl_key = true;
            }
            res.send(obj);
            next(err);
        });
    },
    saveSettings: function (req, res, next) {
        var log = req.log;
        var sapi = req.sdc[req.dc].sapi;
        var moray = req.sdc[req.dc].moray;
        var body = req.body;
        var tasks = [];

        tasks.push(function updateSslCert(cb) {
            var ssl_certificate = body.ssl_certificate || false;
            var ssl_key = body.ssl_key || false;
            if (ssl_certificate && ssl_key) {
                req.log.info('looking for adminui sapi service');
                sapi.listServices({
                    name:'adminui'
                }, function (listServicesErr, services) {
                    if (listServicesErr) {
                        cb(listServicesErr);
                        return;
                    }
                    var adminui = services[0];
                    log.info(adminui, 'found service');
                    sapi.updateService(adminui.uuid, {
                        metadata: {
                            ssl_certificate: ssl_certificate,
                            ssl_key: ssl_key
                        }
                    }, function (err, done) {
                        if (err) {
                            log.fatal(err, 'error updating sapi service');
                            cb(err);
                            return;
                        }
                        cb();
                    });
                });
            } else {
                cb();
            }
        });

        tasks.push(function updateSettings(cb) {
            var networks = body['provision.preset_networks'];
            if (networks) {
                moray.putObject(ADMINUI_BUCKET, 'settings', {
                    'provision.preset_networks': networks
                }, function (err, obj) {
                    if (err) {
                        log.error('error saving settings', err);
                        cb(err);
                        return;
                    }
                    cb();
                });
            } else {
                cb();
            }
        });

        vasync.parallel({
            funcs: tasks
        }, function (err) {
            if (err) {
                log.fatal('error updating settings', err);
                next(err);
                return;
            }
            res.send({});
            next();
        });
    }
};
