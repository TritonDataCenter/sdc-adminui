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

      this.render();
    },

    focusField: function() {
      var username = this.$("input[name=username]");
      var password = this.$("input[name=password]");

      if (username.val().length === 0) {
        username.focus();
      } else {
        password.focus();
      }
    },

    authenticate: function(e) {
      e.preventDefault();
      console.log("Authenticate");
    },

    render: function() {
      $(this.el).html(this.template());
      this.focusField();
      return this;
    }

  })
});
