/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var makeuuid = require('libuuid').create;
var util = require('util');
var NOTES_BUCKET = 'sdcnotes';
var assert = require('assert');

function createNotesBucket(client) {
    var cfg = {
        index: {
            item_uuid: { type: 'string', unique: false },
            owner_uuid: { type: 'string', unique: false },
            note: { type: 'string', unique: false },
            created: { type: 'string', unique: false },
            archived: { type: 'string', unique: false }
        },
        pre: []
    };

    // client.delBucket(NOTES_BUCKET, function () {
    //     client.createBucket(NOTES_BUCKET, cfg, function (err) {
    //         assert.ifError(err);
    //     });
    // });

    client.getBucket(NOTES_BUCKET, function (err) {
        if (err) {
            if (err.name === 'BucketNotFoundError') {
                client.log.info('creating sdcnotes bucket');
                client.createBucket(NOTES_BUCKET, cfg, function (err2) {
                    if (err2) {
                        client.log.fatal(err2, 'error creating sdcnotes bucket');
                    } else {
                        client.log.info('created sdcnotes created');
                    }
                });
            } else {
                client.log.fatal(err, 'error retrieving sdcnotes bucket');
            }
        }
    });
}

module.exports = {
    createNotesBucket: createNotesBucket,

    /**
     * req.params.item_uuid : uuid of resource containing
     */
    getNotes: function (req, res, next) {
        var itemuuid = req.params.item_uuid;

        var opts = {
            sort: {
                attribute: 'created',
                order: 'ASC'
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
            obj.value.uuid = obj.key;
            records.push(obj.value);
        });

        morayReq.on('end', function () {
            res.send(records);
        });
    },

    update: function (req, res, next) {
        var uuid = req.params.uuid;
        var note = req.body;
        if (note.archived === true) {
            note.archived = new Date().toISOString();
        }

        if (note.archived === false) {
            delete note.archived;
        }

        req.sdc[req.dc].moray.putObject(NOTES_BUCKET, uuid, note, function (err) {
            if (err) {
                return next(new Error(err));
            } else {
                note.uuid = uuid;
                return res.send(note);
            }
        });
    },

    create: function (req, res, next) {
        var uuid = makeuuid();
        var item_uuid = req.params.item_uuid;
        var owner_uuid = req.session.data.uuid;
        var note = req.body.note;

        var obj = {
            item_uuid: item_uuid,
            owner_uuid: owner_uuid,
            note: note,
            created: new Date()
        };

        req.sdc[req.dc].moray.putObject(NOTES_BUCKET, uuid, obj, function (err) {
            if (err) {
                return next(new Error(err));
            } else {
                obj.uuid = uuid;
                return res.send(obj);
            }
        });
    }
};
