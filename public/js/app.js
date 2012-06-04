_.str = require('lib/underscore.string');

var User = require('models/user');
var AppView = require('views/app');
var SigninView = require('views/signin');

module.exports = Backbone.Router.extend({

  initialize: function(options) {
    this.dispatcher = _.extend(Backbone.Events, {});

    // holds the state of the currently logged in user
    this.user = new User;

    // The current root view being presented
    this.view = null;

    // The dom element in which the root views are drawn to
    this.container = $("#chrome");

    this.dispatcher.bind('signout', function() {
      this.user.signout();
    }, this);

    this.user.bind('change:authenticated', function(user, value) {
      if (value === true) {
        this.showApp();
      } else {
        this.showSignin();
      }
    }, this);
  },

  routes: {
    '*default': 'reception'
  },

  reception: function(page) {
    this.pageToShow = page || 'dashboard';
    this.user.authenticate();
  },

  showApp: function() {
    this.view = new AppView({
      dispatcher: this.dispatcher
    });

    this.container.html(this.view.render().el);
    this.view.presentView(this.pageToShow || 'dashboard');
  },

  showSignin: function() {
    this.view = new SigninView({
      dispatcher: this.dispatcher,
      model: this.user
    });

    this.container.html(this.view.render().el);
    this.view.focus();
  }
});
