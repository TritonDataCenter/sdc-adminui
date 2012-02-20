define(function(require) {
  var _ = require('underscore');
  var Backbone = require('backbone');

  var User = Backbone.Model.extend({});
  _.extend(User, Backbone.Events);

  User.authenticate = function(username, password, callback) {
    $.post("/auth", { username:username, password:password }, function(res) {
      if (res.code && res.message) {
        User.trigger('error', res);
      } else {
        User.trigger('ok', res)
      }
    });
  }

  return User;
})
