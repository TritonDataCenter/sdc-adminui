var Backbone = require('backbone');
var Package = require('./package');
var Packages = Backbone.Collection.extend({
    model: Package,
    url: '/_/packages',
    search: function(val) {
        if (val.length === 0) {
            this.fetch();
            return;
        }
        var filtered = this.filter(function(m) {
            return m.get('uuid') === val || m.get('name').indexOf(val) !== -1;
        });

        this.reset(filtered);
        this.sort();
    },

    comparator: function(p) {
        return [
            p.get('name'),
            p.get('version')
        ];
    },

    fetchActive: function() {
        this.fetch({
            data: $.param({
                'active': true
            })
        });
    }
});

module.exports = Packages;
