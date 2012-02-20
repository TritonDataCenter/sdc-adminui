define(function(require, exports) {
  var _ = require('underscore'),
    Backbone = require('backbone'),
    SigninView = require('views/signin');

  var AppView = Backbone.View.extend({});

  var App = Backbone.Router.extend({

    initialize: function(options) {
      this.view = new AppView({el: $("#app")});
      this.authenticated = false;
    },

    routes: {
      '': 'reception',
      'signin': 'signin'
    },

    reception: function() {
      if (this.authenticated == false) {
        console.log("Unauthenticated");
        this.navigate('signin', {trigger: true});
      } else {
        console.log("Authenticated: Showing App");
        this.showApp();
      }
    },

    showApp: function() {
      console.log("Showing App");
    },

    signin: function() {
      console.log("Showing SigninView")
      new SigninView({app: this });
    }
  });

  function initialize() {
    var app = new App();
    Backbone.history.start({pushState: true});
    app.navigate();

    return app;
  }

  return {
    initialize: initialize
  }

});
