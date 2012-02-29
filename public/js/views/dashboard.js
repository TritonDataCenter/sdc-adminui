/**
 * views/dashboard.js
 *
 * Dashboard View
 */
ADMINUI.Views.Dashboard = (function() {

  return Backbone.View.extend({
    name: 'dashboard',
    render: function() {
      this.$el.html("<h2>Dashboard</h2>");

      return this;
    }
  });

})();
