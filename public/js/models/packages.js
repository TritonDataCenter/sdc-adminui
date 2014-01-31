var Backbone = require('backbone');
var Package = require('./package');
var Packages = Backbone.Collection.extend({
    model: Package,
    url: '/_/packages',
    initialize: function() {
        this.packagesCache = null;
        this.on('sync', this.populateCache, this);
    },

    populateCache: function() {
        this.packagesCache = this.models;
    },

    search: function(val) {
        if (val.length === 0) {
            if (this.packagesCache && this.packagesCache.length) {
                this.reset(this.packagesCache);
            } else {
                this.fetch();
            }
            return;
        }

        var filtered = this.filter(function(m) {
            return (m.get('owner_uuid') === val ||
                m.get('uuid') === val ||
                m.get('name').toLowerCase().indexOf(val.toLowerCase()) !== -1);
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
