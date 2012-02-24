define(function(require) {
  var _ = require('underscore'),
    Backbone = require('backbone'),
    Template = require('tpl/users');

  return Backbone.View.extend({
    name: 'users',
    render: function() {
      this.$el.html(Template);
      return this;
    }
  });
});
