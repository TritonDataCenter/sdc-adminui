define(function(require) {
    var Job = require('models/job');
	var Server = Backbone.Model.extend({
		urlRoot: '/_/servers',

		idAttribute: 'uuid',

		defaults: {
			sysinfo:{}
		},

		setup: function(callback) {
			$.post(this.url()+'?action=setup', {}, function(data) {
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

        update: function(attrs, cb) {
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