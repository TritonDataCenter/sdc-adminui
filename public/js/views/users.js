define(function(require) {
  // UsersView

  var CreateUserView = require('views/users-create');
  var BaseView = require('views/base');
  var Users = require('models/users');
  var UserView = require('views/user');
  var tplUsers = require('text!tpl/users.html');
  var adminui = require('adminui');

  return Backbone.Marionette.ItemView.extend({

    template: tplUsers,

    url: 'users',

    sidebar: 'users',

    events: {
      'click button[data-event=new-user]': 'newUser',
      'click button[data-event=find-user]': 'findUser',
      'submit .form-search': 'onSearch'
    },

    initialize: function() {
      this.users = new Users();
      this.bindTo(this.users, 'error', this.onError);
    },

    onError: function(model, xhr) {
      adminui.vent.trigger('error', {
        xhr: xhr,
        context: 'users / ufds',
        message: 'error occured while retrieving user information'
      });
    },

    newUser: function() {
      this.createView = new CreateUserView();
      this.createView.render();
    },

    findUser: function() {
      var val = this.$('input[name=findField]').val();
      this.users.searchByLogin(val, function(res) {
        var user = res.at(0);
        if (user) {
          adminui.vent.trigger('showview', 'user', { user: user });
        } else {
          alert('user not found');
        }
      });
    },

    onSearch: function(e) {
      return false;
    },

    loadUserCounts: function() {
      this.users.userCount(this.updateCount);
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
