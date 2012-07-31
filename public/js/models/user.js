/**
 * models/user
*/
var User = module.exports = Backbone.Model.extend({
  defaults: { authenticated: null },
  idAttribute: 'uuid',
  urlRoot: "/_/users",

  _checkExistingAuth: function() {
    var self = this;

    $.get("/_/auth", function(res) {
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

    $.post("/_/auth", data, function(data) {
      self.set(data.user);
      self.set('token', data.token);
      console.log(self);
    }).error(function(xhr) {
      var err = JSON.parse(xhr.responseText);
      self.trigger('error', err.message);
    });
  },

  authenticate: function(username, password) {
    if (arguments.length === 0) {
      this._checkExistingAuth();
    } else {
      this._newAuth(username, password);
    }
  },

  signout: function() {
    $.ajax({
      url: "/_/auth",
      success: function() {
        this.set({authenticated: false});
      },
      type: "DELETE",
      context: this
    });
  }
});
