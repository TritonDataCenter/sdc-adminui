var Backbone = require('backbone');
var Package = require('./package');
var Collection = require('./collection');

var Packages = Collection.extend({
    model: Package,
    url: '/api/packages',
    fetchActive: function() {
        return this.fetch({params:{active: true}});
    }
});

module.exports = Packages;
