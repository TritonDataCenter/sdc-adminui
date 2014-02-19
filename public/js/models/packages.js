var Backbone = require('backbone');
var Package = require('./package');
var Collection = require('./collection');

var Packages = Collection.extend({
    model: Package,
    url: '/_/packages',
    fetchActive: function() {
        this.fetch({params:{active: true}});
    }
});

module.exports = Packages;
