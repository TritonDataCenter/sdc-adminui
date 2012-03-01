var UserCreateView = module.exports = Backbone.View.extend({

  template: Handlebars.compile($("#template-users-create").html()),

  initialize: function() {

  },

  render: function() {
    this.$el = $(this.template()).modal({keyboard: false});

    this.$el.on('shown', _.bind(function() {
      this.$("input:first").focus();
    }, this));

    return this;
  }

});
