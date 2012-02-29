/**
 * views/machines.js
 */
ADMINUI.Views.Machines = (function(ADMINUI) {

  return Backbone.View.extend({
    name: 'machines',
    render: function() {
      this.$el.html("<h2>Machines</h2>");

      return this;
    }
  })

})(ADMINUI);
