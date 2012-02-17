define(function(require, exports) {
  var _ = require('underscore'),
    Backbone = require('backbone'),
    SigninView = require('views/signin');

  var Router = Backbone.Router.extend({
    routes: {
      '': 'showSigninView'
    },
    showSigninView: function() {
      var SigninView = require('views/signin');

      new SigninView({ el: $("#app") });
    }
  });

  function initialize() {
    var router = new Router();
    Backbone.history.start();
    router.navigate();
    return router;
  }


  return {
    initialize: initialize
  }

});
