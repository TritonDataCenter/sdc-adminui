/**
 * views/machines.js
*/

var MachinesView = module.exports = Backbone.View.extend({
  name: 'machines',
  render: function() {
    this.$el.html("<h2>Machines</h2>");

    return this;
  }
});
