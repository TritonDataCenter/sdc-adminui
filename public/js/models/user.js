/**
 * models/user
*/
var User = module.exports = Backbone.Model.extend({

  defaults: {
    authenticated: null
  },

  _checkExistingAuth: function() {
    var self = this;

    $.get("/auth", function(res) {
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

    if (user.length == 0 || pass.length == 0) {
      this.trigger('error', 'Username and Password Required');
      return false;
    }

    var data = { username: user, password: pass }

    $.post("/auth", data, function(res) {
      if (res.code && res.message) {
        self.set({authenticated: false});
        self.trigger('error', res.message);
      } else {
        self.set({authenticated: true});
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
  },

  signout: function() {
    $.ajax({
      url: "/auth",
      success: function() {
        this.set({authenticated: false});
      },
      type: "DELETE",
      context: this
    });
  }
});
