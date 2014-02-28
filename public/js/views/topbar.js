var Backbone = require('backbone');
var app = require('../adminui');
var moment = require('moment');

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
        this.renderTime();
        this.renderVersion();
        this._timer = setInterval(this.renderTime.bind(this), 1000);
    },
    renderVersion: function() {
        this.$('.version').html(app.version);
    },

    renderTime: function() {
        var serverTime = moment().utc().format("MMM D h:mm");
        return this.$('.server-time time').html(serverTime);
    },

    onClose: function() {
        clearInterval(this._timer);
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
