/**
 * views/signin
 */
define(function(require) {
  var Backbone = require('backbone')
  var _ = require('underscore');
  var template = require('text!tpl/signin.html');
  var User = require('models/user');

  return Backbone.View.extend({
    template: Handlebars.compile(template),

    events: {
      'submit form': "authenticate"
    },

    initialize: function(options) {
      _.bindAll(this);

      this.app = options.app;
      this.model = User;

      this.model.on('error', function(err) {
        this.showMessage(err.message);
        this.focusField();
      }, this);

      this.model.on('ok', function(user) {
        this.remove();
        this.app.authenticated = true;
        this.app.navigate('', {trigger:true, replace:true});
      }, this)

      this.render();
      this.focusField();
      this.hideMessage();
    },

    showMessage: function(msg) {
      this.$(".alert .msg").html(msg);
      this.$(".alert").show();
    },

    hideMessage: function() {
      this.$(".alert").hide();
    },

    username: function() {
      return this.$("input[name=username]");
    },

    password: function() {
      return this.$("input[name=password]");
    },

    focusField: function() {
      if (this.username().val().length === 0) {
        this.username().focus();
      } else {
        this.password().focus();
      }
    },

    authenticate: function(e) {
      e.preventDefault();
      this.hideMessage();
      this.model.authenticate(this.username().val(), this.password().val());
    },

    render: function() {
      this.$el.html(this.template());
      this.app.view.$el.html(this.$el);

      return this;
    }

  });
});
