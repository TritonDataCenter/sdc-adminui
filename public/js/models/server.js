define(['backbone'], function() {
	var Server = Backbone.Model.extend({
		urlRoot: '/_/servers',

		idAttribute: 'uuid',

		defaults: {
			sysinfo:{}
		},

		setup: function(callback) {
			$.post(this.url()+'?action=setup', {}, function(res) {
                console.log(res);
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