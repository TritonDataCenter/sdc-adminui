var User = require('models/image');

var Users = module.exports = Backbone.Collection.extend({
  model: User,
  url: '/_/users',

  searchByLogin: function(login) {
    this.fetch({data: $.param({'login':login}) });
  }
});
