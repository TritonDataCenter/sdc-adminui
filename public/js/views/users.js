ADMINUI.Views.Users = (function() {

  return Backbone.View.extend({

    template: Handlebars.compile($("#template-users").html()),

    name: 'users',

    events: {
      'submit .form-search': 'onSearch'
    },

    focus: function() {
      this.$(".form-search input[type=text]").focus();
    },

    onSearch: function(e) {
      return false;
    },

    render: function() {
      this.$el.html(this.template());
      return this;
    }
  });
})();
