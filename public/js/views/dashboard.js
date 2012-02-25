/**
 * views/dashboard.js
 *
 * Dashboard View
 */
define(function(require) {

  var _ = require('underscore'),
    Backbone = require('backbone');

  return Backbone.View.extend({
    name: 'dashboard',
    render: function() {
      this.$el.html("<h2>Dashboard</h2>");

      return this;
    }
  })
});
