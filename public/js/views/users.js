define(function(require) {
  // UsersView

  var CreateUserView = require('views/users-create');
  var BaseView = require('views/base');
  var Users = require('models/users');
  var UserView = require('views/user');
  var tplUsers = require('text!tpl/users.html');
  var app = require('adminui');

  return Backbone.Marionette.ItemView.extend({

    template: tplUsers,

    url: 'users',

    sidebar: 'users',

    events: {
      'click button[data-event=new-user]': 'newUser',
      'click button[data-event=find-user]': 'findUser',
      'submit .form-search': 'onSearch'
    },

    newUser: function() {
      this.createView = new CreateUserView();
      this.createView.render();
    },

    findUser: function() {
      var val = this.$findField.val();
      var users = new Users();
      users.searchByLogin(val, function(res) {
        var user = res.at(0);
        app.vent.trigger('showview', 'user', { user: user });
      });
    },

    onSearch: function(e) {
      return false;
    },

    loadUserCounts: function() {
      var users = new Users();
      users.userCount(this.updateCount);
    },

    updateCount: function(c) {
      this.$('.total-accounts').html(c);
    },

    onRender: function() {
      this.$findField = this.$('.findField');
      this.loadUserCounts();
      return this;
    }
  });
});
