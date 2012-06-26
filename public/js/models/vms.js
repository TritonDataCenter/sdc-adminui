var Vm = require('models/vm');
var Vms = module.exports = Backbone.Collection.extend({
  model: Vm,
  url: "/_/vms"
});
