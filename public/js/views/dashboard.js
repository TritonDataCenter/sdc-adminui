/**
 * views/dashboard.js
 *
 * Dashboard View
*/

var View = require('views/base');
var Dashboard = module.exports = View.extend({
  name: 'dashboard',
  template: 'dashboard',
  render: function() {
    this.setElement(this.template());
    return this;
  }
});
