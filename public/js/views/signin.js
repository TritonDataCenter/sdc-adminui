/**
 * views/signin
 */
define(function(require) {
  var Backbone = require('backbone')
  var _ = require('underscore');
  var template = require('text!tpl/signin.html');

  return Backbone.View.extend({
    template: Handlebars.compile(template),

    events: {
      'submit form': "authenticate"
    },

    initialize: function(options) {
      _.bindAll(this);

      this.app = options.app;
      this.model = this.app.user;

      this.model.bind('change:authenticated', function(user, value) {
        if (value === true) {
          this.remove();
        }
      }, this);

      this.render();
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

    focus: function() {
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

      return this;
    }

  });
});
