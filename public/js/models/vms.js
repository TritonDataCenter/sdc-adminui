var Backbone = require('backbone');
var Vm = require('./vm');

  module.exports = Backbone.Collection.extend({
model: Vm,

url: "/_/vms",

initialize: function(options) {
  this.options = options || {};
},

fetch: function(opts) {
  opts = opts || {};
  if (this.options.params) {
    opts.data = $.param(this.options.params);
  }

  Backbone.Collection.prototype.fetch.call(this, opts);
}

  });

