/**
 * views/machines.js
 *
 * Dashboard View
 */
define(function(require) {

  var _ = require('underscore'),
    Backbone = require('backbone');

  return Backbone.View.extend({
    name: 'machines',
    render: function() {
      this.$el.html("<h2>Machines</h2>");

      return this;
    }
  })
});
