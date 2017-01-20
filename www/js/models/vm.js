/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var _ = require('underscore');
var $ = require('jquery');
var Model = require('./model');
var Job = require('./job');
var api = require('../request');

var Vm = Model.extend({
    urlRoot: '/api/vms',

    idAttribute: 'uuid',

    update: function(attrs, cb) {
        var req = api.post(this.url() + '?action=update').send(attrs);
        req.end(function(res) {
            if (res.ok) {
                var job = new Job({ uuid: res.body.job_uuid });
                cb(job);
            } else {
                cb(null, res.body);
            }
        });
    },

    updateTags: function (tags, cb) {
        var req = api.put(this.url() + '/tags').send(tags);
        req.end(function(res) {
            if (res.ok) {
                var job = new Job({ uuid: res.body.job_uuid });
                cb(job);
            } else {
                cb(null, res.body);
            }
        });
    },

    start: function(cb) {
        $.post(this.url() + '?action=start', {}, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
        });
    },

    stop: function(cb) {
        $.post(this.url() + '?action=stop', {}, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
        });
    },

    reboot: function(cb) {
        $.post(this.url() + '?action=reboot', {}, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
        });
    },

    del: function(cb) {
        $.delete_(this.url(), function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
        });
    },

    getSync: function(cb) {
        $.get(this.url() + '?sync=true', {}, function(data) {
            cb(data.state);
        });
    },

    createSnapshot: function(cb) {
        var req = $.post(this.url() + '?action=create_snapshot', {});
        req.done(function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
        });
        req.error(function(res) {
            var error = {};
            try {
                error = JSON.parse(res.responseText);
            } catch (e) {
                error.message = 'Error creating snapshot: '+ res.statusText;
            }
            cb(null, error);
        });
    },

    rollbackSnapshot: function(snapshotName, cb) {
        $.post(this.url() + '?action=rollback_snapshot', {
            name: snapshotName
        }, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });

            cb(job);
        });
    },

    deleteSnapshot: function (snapshotName, cb) {
        $.post(this.url() + '?action=delete_snapshot', {
            name: snapshotName
        }, function (data) {
            cb(new Job({
                uuid: data.job_uuid
            }));
        });
    },

    reprovision: function (imageUuid, cb) {
        var req = $.post(this.url() + '?action=reprovision', {
            image_uuid: imageUuid
        });
        req.done(function (data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(null, job);
        });
        req.fail(function(xhr, status, errThrown) {
            var message;
            try {
                message = JSON.parse(xhr.responseText).message;
            } catch(err) {
                message = errThrown;
            }
            cb(message);
        });
    },

    addNics: function(networks, cb) {
        var req = $.post(this.url() + '?action=add_nics', {
            networks: networks
        });
        req.done(function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(null, job);
        });
        req.fail(function(xhr, status, errThrown) {
            cb(errThrown);
        });
    },
    updateNics: function(nics, cb) {
        var req = $.ajax({
            url: this.url() + '?action=update_nics',
            type: 'POST',
            data: JSON.stringify({nics: nics}),
            contentType: "application/json; charset=utf-8",
            dataType: "json"
        });
        req.done(function(data) {
            var job = new Job({ uuid: data.job_uuid });
            cb(null, job);
        });
        req.fail(function(xhr, status, errThrown) {
            cb(errThrown);
        });
    },

    removeNics: function(macs, cb) {
        $.post(this.url() + '?action=remove_nics', {
            macs: macs
        }, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
        });
    },


    saveAlias: function(cb) {
        var req = api.put(this.url()).send({alias: this.get('alias')});

        req.end(function(res) {
            if (res.ok) {
                var data = res.body;
                var job = new Job({ uuid: data.job_uuid });
                cb(null, job);
            } else {
                var err = _.findWhere(res.body.errors, {'field': 'alias'});
                cb(err);
            }
        });
    },

    saveCustomerMetadata: function(cb) {
        $.put(this.url() + '/customer_metadata', this.get('customer_metadata'), function(data) {
            var job = new Job({ uuid: data.job_uuid });
            cb(null, job);
        }).fail(function(err) {
            cb(err);
        });
    },

    ips: function() {
        return this.get('nics').map(function(n) {
            return n.ip;
        });
    }
});

module.exports = Vm;
