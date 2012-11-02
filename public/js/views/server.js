define(function(require) {

    var Server = require('models/server');
    var BaseView = require('views/base');
    var ServerTemplate = require('text!tpl/server.html')

    var ServerView = Backbone.Marionette.ItemView.extend({
        sidebar: 'servers',

        template: ServerTemplate,

        initialize: function(options) {
            this.model = options.server || new Server();

            if (options.uuid) {
                this.model.set({uuid: options.uuid});
                this.model.fetch();
            }
            this.bindTo(this.model, 'change', this.render, this);
        },

        templateHelpers: {
            platform_version: function() {
                return this.sysinfo['Live Image'];
            },
            cpu_type: function() {
                return this.sysinfo['CPU Type'];
            },
            cpu_cores: function() {
                return this.sysinfo['CPU Physical Cores'];
            },
            serial_number: function() {
                return this.sysinfo['Serial Number'];
            },
            total_memory: function() {
                return this.sysinfo['MiB of Memory'];
            }
        },

        serializeData: function() {
            var data = Marionette.ItemView.prototype.serializeData.call(this);
            data.disks = _.map(data.sysinfo['Disks'], function(v, k) {
                return {name: k, size: v['Size in GB']};
            });
            return data;
        },

        url: function() {
            return _.str.sprintf('servers/%s', this.model.get('uuid'));
        }
    });

    return ServerView;
});