(function(ADMINUI) {
  'use strict'

  var App = Backbone.Router.extend({

    initialize: function(options) {
      this.dispatcher = _.extend(Backbone.Events, {});

      this.socket = io.connect();;

      this.socket.on("connect", function() {
        console.log("[WS] Connected");
      });

      this.socket.on("message", function(msg) {
        console.log("[WS] Message ", msg);
      });

      // holds the state of the currently logged in user
      this.user = new ADMINUI.Models.User();

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
      console.log("start-showapp");

      this.view = new ADMINUI.Views.App({ dispatcher: this.dispatcher });
      this.container.html(this.view.render().el);
      this.view.presentView(this.pageToShow);
    },

    showSignin: function() {
      console.log("Showing SigninView");
      this.view = new ADMINUI.Views.Signin({
        dispatcher: this.dispatcher,
        model: this.user
      });

      this.container.html(this.view.el);
      this.view.focus();
    }
  });

  ADMINUI.App = App;
})(ADMINUI);
