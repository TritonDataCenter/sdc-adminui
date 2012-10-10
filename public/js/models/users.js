define(function(require) {
  var User = require('models/user');
  var Users = Backbone.Collection.extend({
    model: User,
    url: '/_/users',

    searchByLogin: function(login, successCb) {
      this.fetch({
        data: $.param({'login':login}),
        success: successCb
      });
    }
  });

  return Users;
});
