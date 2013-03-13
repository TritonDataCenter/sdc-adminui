define(function(require) {
    var Marionette = require('backbone.marionette');

    var Topbar = Backbone.Marionette.ItemView.extend({
        events: {
            'click a[data-trigger=signout]': 'signout'
        },

        initialize: function(options) {
            this.user = options.user;
        },

        signout: function() {
            var app = require('adminui');
            app.vent.trigger('signout');
        },

        serializeData: function() {
            return {
                user: this.user
            };
        }

    });
    return Topbar;
});