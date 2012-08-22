define(function(require) {
  var Vm = Backbone.Model.extend({
    urlRoot: '/_/vms',

    idAttribute: 'uuid',

    defaults: {
      nics: []
    }
  });

  Vm.prototype.start = function(cb) {
    $.post(this.url(), {action:'start'}, cb);
  };

  Vm.prototype.stop = function(cb) {
    $.post(this.url(), {action:'stop'}, cb);
  };

  Vm.prototype.reboot = function(cb) {
    $.post(this.url(), {action:'reboot'}, cb);
  };

  Vm.prototype.delete = function(cb) {
    $.delete_(this.url(), cb);
  };

  Vm.prototype.ips = function() {
    return this.get('nics').map(function(n) {
      return n.ip;
    });
  };

  return Vm;

});
