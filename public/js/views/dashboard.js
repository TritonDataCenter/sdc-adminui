/**
 * views/dashboard.js
 *
 * Dashboard View
 */
define(function(require) {

  var _ = require('underscore'),
    Backbone = require('backbone');

  return Backbone.View.extend({

    render: function() {
      this.$el.html("<h4>Dashboard</h4>");

      return this;
    }
  })
});
