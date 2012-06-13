_.str = require('lib/underscore.string');

window.$a = {};

var User = require('models/user');
var AppView = require('views/app');
var SigninView = require('views/signin');

var BaseView = require('views/base');

var eventBus = window.$a.eventBus = _.extend(Backbone.Events, {});

// Attach eventBus to BaseView prototype
BaseView.prototype.eventBus = eventBus;

module.exports = Backbone.Router.extend({

  initialize: function(options) {

    // holds the state of the currently logged in user
    this.user = new User;

    // The current root view being presented
    this.view = null;

    // The dom element in which the root views are drawn to
    this.container = $("#chrome");

    this.eventBus = eventBus;
    this.eventBus.bind('signout', function() {
      this.user.signout();
    }, this);

    this.eventBus.on('wants-view', function(view, args) {
      this.view.presentView(view, args);
    }, this);
  },

  routes: {
    '*default': 'reception'
  },

  reception: function(page) {
    if (! this.view) {
      this.view = new AppView();
      this.container.html(this.view.render().el);
    }
    this.pageToShow = page || 'dashboard';
    this.view.presentView(this.pageToShow || 'dashboard');
  },

  showSignin: function() {
    this.view = new SigninView({ model: this.user });

    this.container.html(this.view.render().el);
    this.view.focus();
  }
});
