var Backbone = require('backbone');
var app = require('../adminui');

var Topbar = Backbone.Marionette.ItemView.extend({
    events: {
        'click a.signout': 'signout'
    },

    initialize: function() {
        this.listenTo(app.state, 'change:datacenter', this.renderDatacenter);
    },

    signout: function() {
        app.vent.trigger('signout');
    },

    onShow: function() {
        this.renderDatacenter();
        this.renderLoginName();
    },

    renderDatacenter: function() {
        var datacenter = app.state.get('datacenter');
        this.$('.datacenter').html(datacenter);
    },

    renderLoginName: function() {
        var login = app.user.get('login');

        this.$('.acc-controls .login-name').html(login);
    }
});

module.exports = Topbar;
