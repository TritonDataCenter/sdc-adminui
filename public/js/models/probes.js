var Probe = require('models/probe');

var Probes = Backbone.Collection.extend({
  url: '/_/amon/probes',
  model: Probe
});

module.exports = Probes;
