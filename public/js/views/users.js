'use strict';

var CreateUserView = require('views/users-create');
var BaseView = require('views/base');

var UsersView = module.exports = BaseView.extend({

  template: "users",

  name: 'users',

  events: {
    'click button[data-event=new-user]': 'newUser',
    'submit .form-search': 'onSearch'
  },

  initialize: function() {
    _.bindAll(this, 'newUser');
  },

  newUser: function() {
    this.createView = new CreateUserView();
    this.createView.render();
  },

  onSearch: function(e) {
    return false;
  },

  render: function() {
    this.$el.html(this.template());
    return this;
  }
});
