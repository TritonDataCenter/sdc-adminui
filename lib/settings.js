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
            if (err.name !== 'BucketNotFoundError') {
                client.log.fatal(err, 'error retrieving settings bucket from moray');
                return;
            }
            req.log.info('Creating adminui moray bucket');
            client.createBucket(ADMINUI_BUCKET, ADMINUI_BUCKET_CFG, function(err) {
                if (err) {
                    client.log.fatal(err, 'error creating settings bucket: %s', err.message);
                    return;
                }
                onBucketReady();
            });
        } else {
            onBucketReady();
        }
    });
}



module.exports = {
    createSettingsBucket: createSettingsBucket,
    getSettings: function(req, res, next) {
        var morayReq = req.sdc[req.dc].moray.getObject(ADMINUI_BUCKET, 'settings', function(err, obj) {
            res.send(obj.value);
        });
    },
    putSettings: function(req, res, next) {
        var body = req.body;
        var morayReq = req.sdc[req.dc].moray.putObject(ADMINUI_BUCKET, 'settings', body, function(err, obj) {
            res.send(obj.value);
        });
    }
}
