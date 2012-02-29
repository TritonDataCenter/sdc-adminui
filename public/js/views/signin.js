/**
 * views/signin
*/
(function(ADMINUI) {
  ADMINUI.Views.Signin = Backbone.View.extend({
    template: Handlebars.compile($("#template-signin").html()),

    events: {
      'submit form': 'authenticate',
      'click .alert a.close': 'hideMessage',
    },

    initialize: function(options) {
      _.bindAll(this);
      this.model = options.model;

      this.model.bind('change:authenticated', function(user, value) {
        if (value === true) {
          this.remove();
        }
      }, this);

      this.model.bind('error', function(message) {
        this.showMessage(message);
        this.password().val('');
      }, this);

      this.render();
      this.hideMessage();
    },

    showMessage: function(msg) {
      this.$(".alert .msg").html(msg);
      this.$(".alert").show();
    },

    hideMessage: function(e) {
      if (e) {
        e.stopPropagation();
      }
      this.$(".alert").hide();
      this.focus();
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
})(ADMINUI);
