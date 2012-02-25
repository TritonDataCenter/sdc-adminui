define(function(require) {
  'use strict'

  var _ = require('underscore'),
    Backbone = require('backbone'),
    AppView = require('views/chrome'),
    SigninView = require('views/signin'),
    User = require('models/user');

  Backbone.sync = function(method, model, options) {
    options.error = function(xhr, ajaxOptions, thrownError) {
      if (xhr.status == 401) {
        window.location = '/';
      }
    }
    sync(method, model, options);
  };


  var App = Backbone.Router.extend({

    initialize: function(options) {

      this.dispatcher = _.extend(Backbone.Events, {});

      // holds the state of the currently logged in user
      this.user = new User();

      // The current root view being presented
      this.view = null;

      // The dom element in which the root views are drawn to
      this.container = $("#chrome");

      this.dispatcher.bind('signout', function() {
        console.log("signout");
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
        dispatcher: this.dispatcher,
        contentView: this.pageToShow
      });

      this.container.html(this.view.render().el);
    },

    showSignin: function() {
      console.log("Showing SigninView");
      this.view = new SigninView({ app: this });
      this.container.html(this.view.el);
      this.view.focus();
    }
  });


  function initialize() {
    var app = new App();
    Backbone.history.start({pushState: true});

    return app;
  }

  return {
    initialize: initialize
  }

});
