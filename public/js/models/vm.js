var Vm = module.exports = Backbone.Model.extend({
  urlRoot: '/_/vms',

  idAttribute: 'uuid',

  defaults: {
    nics: []
  }
});

Vm.prototype.ips = function() {
  return this.get('nics').map(function(n) {
    return n.ip;
  });
}
