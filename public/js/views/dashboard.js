/**
 * views/dashboard.js
 *
 * Dashboard View
*/
var Dashboard = module.exports = Backbone.View.extend({
  name: 'dashboard',

  render: function() {
    this.$el.html("<h2>Dashboard</h2>");
    return this;
  }
});
