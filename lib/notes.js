var makeuuid = require('node-uuid');
var util = require('util');
var NOTES_BUCKET = 'sdcnotes';
var assert = require('assert');

function createNotesBucket(client) {
    var cfg = {
        index: {
            item_uuid: { type: "string", unique: false },
            owner_uuid: { type: "string", unique: false },
            note: { type: "string" },
            created: { type: "string" }
        },
        pre: []
    };

    // client.delBucket(NOTES_BUCKET, function() {
    //     client.createBucket(NOTES_BUCKET, cfg, function (err) {
    //         assert.ifError(err);
    //     });
    // });

    client.getBucket(NOTES_BUCKET, function(err) {
        if (err) {
            client.log(err);
            client.createBucket(NOTES_BUCKET, cfg, function (err) {
                assert.ifError(err);
            });
        }
    });
}

module.exports = {
    createNotesBucket: createNotesBucket,
    /**
     * req.params.item_uuid : uuid of resource containing
     */
    getNotes: function(req, res, next) {
        var itemuuid = req.params.item_uuid;

        var opts = {
            sort: {
                attribute: "created",
                order: "ASC"
            }
        };

        var morayReq = req.sdc[req.dc].moray.findObjects(NOTES_BUCKET,
            util.format('(item_uuid=%s)', itemuuid), opts);
        var records = [];

        morayReq.once('error', function (err) {
            req.sdc[req.dc].moray.log.fatal(err);
            return next(err);
        });

        morayReq.on('record', function (obj) {
            obj.value.uuid = obj.uuid;
            records.push(obj.value);
        });
        
        morayReq.on('end', function() {
            res.send(records);
        });
    },

    create: function(req, res, next) {
        var uuid= makeuuid();
        var item_uuid = req.params.item_uuid;
        var owner_uuid = req.session.data.uuid;
        var note = req.body.note;

        var obj = {
            item_uuid: item_uuid,
            owner_uuid: owner_uuid,
            note: note,
            created: new Date()
        };

        req.sdc[req.dc].moray.putObject(NOTES_BUCKET, uuid, obj, function(err) {
            if (err) {
                return next(new Error(err));
            } else {
                return res.send(obj);
            }
        });
    }
}