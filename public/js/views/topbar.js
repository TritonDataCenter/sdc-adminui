var Backbone = require('backbone');
var app = require('../adminui');

var Topbar = Backbone.Marionette.ItemView.extend({
    events: {
        'click a.signout': 'signout'
    },

    initialize: function(options) {
        this.user = options.user;
    },

    signout: function() {
        app.vent.trigger('signout');
    },

    renderLoginName: function() {
        this.$('.acc-controls .login-name').html(this.user.get('login'));
    },

    serializeData: function() {
        return {
            user: this.user
        };
    }
});

module.exports = Topbar;