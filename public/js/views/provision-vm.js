/**
 * views/provision-vm.js
 *
 * Provision a VM
*/

var Base = require('views/base');
var View = module.exports = Base.extend({
  name: 'provision',

  template: 'provision-vm',

  render: function() {
    this.setElemen(this.template());
    return this;
  }
});
