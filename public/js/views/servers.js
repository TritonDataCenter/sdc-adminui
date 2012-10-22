define(function(require) {
    /**
    * views/servers.js
    */


    var adminui = require('adminui');
    var Servers = require('models/servers');
    var tplServers = require('text!tpl/servers.html');

    var ServersListItem = Backbone.Marionette.ItemView.extend({
        template: require('text!tpl/servers-list-item.html'),
        tagName: 'tr',

        events: {
            'click td':'navigateToServerDetails',
            'click button.setup':'setupServer'
        },

        uri: function() {
            return 'servers';
        },
        templateHelpers: {
            running: function() {
                return this.status == 'running';
            },
            not_setup: function() {
                return this.setup == 'false';
            },
            memory_percent: function() {
                var free = (this.memory_total_bytes-this.memory_available_bytes);
                return _.str.sprintf("%0.1f", free / this.memory_total_bytes * 100);
            },
            'memory_available_mb': function() {
                return _.str.sprintf("%0.1f", this.memory_available_bytes/1024/1024);
            },
            'memory_total_mb': function() {
                return _.str.sprintf("%0.1f", this.memory_total_bytes/1024/1024);
            }
        },
        setupServer: function(e) {
            e.stopPropagation();

            console.log('Setup server');

            this.model.setup(function(res) {
                console.log('Setup Server returned');
                console.log(res);
            });
        },

        navigateToServerDetails: function() {
            adminui.vent.trigger('showview', 'server', { server:this.model });
        }
    });

    var ServersView = Backbone.Marionette.CompositeView.extend({
        name: 'servers',
        template: tplServers,
        itemView: ServersListItem,
        itemViewContainer: 'tbody',

        initialize: function(options) {
            this.collection = new Servers();
            this.collection.fetch();
        }
    });

    return ServersView;
});
