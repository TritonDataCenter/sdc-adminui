define(function(require) {
  'use strict'

  var _ = require('underscore'),
    Backbone = require('backbone');

  var template = require('text!tpl/users.html');

  return Backbone.View.extend({
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
      this.$el.html(template);
      return this;
    }
  });
});
