/**
 * models/user
 */
define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');

  var User = Backbone.Model.extend({
    _checkExistingAuth: function() {
      var self = this;

      console.log("Checking Existing Identity")
      $.get("/auth", function(res) {
        console.log(res);
        if (Object.keys(res).length === 0) {
          console.log("No Existing Identity");
          self.set({authenticated: false});
        } else {
          console.log("Identity Found");
          self.set({authenticated: true});
          self.set(res);
        }
      });
    },

    _newAuth: function(user, pass) {
      var self = this;
      var data = { username: user, password: pass }

      $.post("/auth", data, function(res) {
        console.log(res);
        if (res.code && res.message) {
          self.set({authenticated: false});
        } else {
          self.set({authenticated: true});
          self.set(res);
          self.trigger('error', res);
        }
      });
    },

    authenticate: function(username, password) {
      var self = this;

      if (arguments.length === 0) {
        this._checkExistingAuth();
      } else {
        this._newAuth(username, password);
      }
    }
  });


  return User;
})
