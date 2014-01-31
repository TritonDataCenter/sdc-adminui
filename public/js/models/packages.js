var Backbone = require('backbone');
var Package = require('./package');
var Collection = require('./collection');

var Packages = Collection.extend({
    model: Package,
    url: '/_/packages'
});

module.exports = Packages;
