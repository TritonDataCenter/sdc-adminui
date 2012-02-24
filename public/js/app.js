define(function(require, exports) {
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

      // holds the state of the currently logged in user
      this.user = new User();

      // The current root view being presented
      this.view = null;

      // The dom element in which the root views are drawn to
      this.container = $("#chrome");

      this.user.bind('change:authenticated', function(user, value) {
        if (value === true) {
          this.showApp();
        } else {
          this.showSignin();
        }
      }, this);
    },

    routes: {
      '': 'reception',
      ':page': 'showApp'
    },

    reception: function() {
      this.user.authenticate();
    },

    showApp: function(page) {
      this.view = new AppView({ contentView: page });
      this.container.html(this.view.render().el);
    },

    showSignin: function() {
      console.log("Showing SigninView")
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
