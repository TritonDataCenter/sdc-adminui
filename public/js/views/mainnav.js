var Backbone = require('backbone');
var app = require('adminui');
var moment = require('moment');
var React = require('react');

var AlarmsMenu = require('../components/alarms-menu.jsx');

var Mainnav = Backbone.Marionette.ItemView.extend({
    events: {
        'click a.signout': 'signout',
        'click a.current-user': 'goToUser',
        'click .main-nav li[data-view]':'onSelect'
    },

    initialize: function(options) {
        this.vent = options.vent;
        this.listenTo(app.state, 'change:datacenter', this.renderDatacenter);
        this.listenTo(this.vent, 'mainnav:highlight', this.highlight, this);
    },

    signout: function() {
        app.vent.trigger('signout');
    },

    onShow: function() {
        this.renderDatacenter();
        this.renderLoginName();
        this.renderTime();
        this.renderVersion();

        React.renderComponent(new AlarmsMenu({
            user: app.user.get('adminUuid')
        }), this.$('.nav .alarms').get(0));
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

    goToUser: function(e) {
        e.preventDefault();
        app.vent.trigger('showview', 'user', {uuid: app.user.get('uuid') });
    },

    renderDatacenter: function() {
        var datacenter = app.state.get('datacenter');
        this.$('.datacenter').html(datacenter);
    },

    renderLoginName: function() {
        var login = app.user.get('login');
        this.$('.login-name').html(login);
        this.$('.current-user').attr('href', '/users/'+app.user.get('uuid'));
    },

    onSelect: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return true;
        }

        e.preventDefault();
        var li = $(e.currentTarget);
        var view = li.attr("data-view");
        this.highlight(view);
        this.vent.trigger("showview", view);
    },

    highlight: function(view) {
        this.$("li").removeClass('active');
        this.$("li i").removeClass("icon-white");

        var li = this.$('li[data-view='+view+']');

        li.addClass('active');
        li.find("i").addClass("icon-white");
    }
});

module.exports = Mainnav;
