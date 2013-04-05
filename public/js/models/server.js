define(function(require) {
    var Job = require('models/job');
	var Server = Backbone.Model.extend({
		urlRoot: '/_/servers',

		idAttribute: 'uuid',

		defaults: {
			sysinfo:{}
		},

		setup: function(opts, callback) {
            opts = opts || {};
			$.post(this.url()+'?action=setup', opts, function(data) {
                var job = new Job({uuid: data.job_uuid});
                callback(job);
            });
		},

        factoryReset: function(callback) {
            $.post(this.url()+'?action=factory-reset', {}, function(data) {
                var job = new Job({uuid: data.job_uuid});
                callback(job);
            });
        },

        reboot: function(callback) {
            $.post(this.url()+'?action=reboot', {}, function(data) {
                var job = new Job({uuid: data.job_uuid});
                callback(job);
            });
        },

        forget: function(cb) {
            $.delete_(this.url(), {}, function(data) {
                console.log(data);
                cb();
            });
        },

        update: function(attrs, cb) {
            this.set(attrs);
            $.ajax({
                url: this.url(),
                type: "PUT",
                data: JSON.stringify(attrs),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: cb
            });
        }

	});
	return Server;
});