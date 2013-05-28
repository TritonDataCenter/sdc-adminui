var Backbone = require('backbone');
var Job = require('./job');
var Model = require('./model');
var Server = Model.extend({
    urlRoot: '/_/servers',

    idAttribute: 'uuid',

    defaults: {
        sysinfo: {}
    },

    setup: function(opts, callback) {
        opts = opts || {};
        $.post(this.url() + '?action=setup', opts, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            callback(job);
        });
    },

    factoryReset: function(callback) {
        $.post(this.url() + '?action=factory-reset', {}, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            callback(job);
        });
    },

    updateNics: function(data, callback) {
        $.ajax({
            url: this.url() + '?action=update-nics',
            type: "POST",
            data: JSON.stringify(data),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function(res) {
                var job = new Job({
                    uuid: res.job_uuid
                });
                callback(job);
            }
        });
    },

    reboot: function(callback) {
        $.post(this.url() + '?action=reboot', {}, function(data) {
            var job = new Job({
                uuid: data.job_uuid
            });
            callback(job);
        });
    },

    forget: function(cb) {
        $.delete_(this.url(), {}, function(data) {
            cb();
        });
    }
});

module.exports = Server;
