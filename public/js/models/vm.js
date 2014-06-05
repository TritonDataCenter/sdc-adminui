var Backbone = require('backbone');
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
                var job = new Job({ uuid: req.body.job_uuid });
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

    createSnapshot: function(cb) {
        $.post(this.url() + '?action=create_snapshot', {}, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            cb(job);
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

    reprovision: function(imageUuid, cb) {
        var req = $.post(this.url() + '?action=reprovision', {
            image_uuid: imageUuid
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
