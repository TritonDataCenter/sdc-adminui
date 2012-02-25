define(function(require) {
  'use strict'

  var _ = require('underscore'),
    Backbone = require('backbone');

  var template = require('text!tpl/users.html');

  return Backbone.View.extend({
    name: 'users',
    render: function() {
      this.$el.html(template);
      return this;
    }
  });
});
