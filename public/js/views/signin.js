/**
 * views/signin
*/

var Signin = module.exports = Backbone.View.extend({
  template: Handlebars.compile($("#template-signin").html()),

  events: {
    'submit form': 'authenticate'
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
  },

  showMessage: function(msg) {
    this.$(".alert .msg").html(msg);
    this.$(".alert").show();
  },

  hideMessage: function(e) {
      this.$(".alert").hide();
      this.focus();
  },

  username: function() {
      return this.$("input[name=username]");
  },

  password: function() {
      return this.$("input[name=password]");
  },

  onShow: function() {
      this.focus();
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
    this.hideMessage();

    return this;
  }

});
