var Backbone = require('backbone');
var _ = require('underscore');

var Collection = function(models, options) {
    Backbone.Collection.apply(this, arguments);

    if (models && models.length) {
        this.loaded = true;
    }

    this.listenTo(this, 'sync', this.loaded, this);
    this.listenTo(this, 'reset', this.loaded, this);
};

_.extend(Collection, Backbone.Collection);

_.extend(Collection.prototype, Backbone.Collection.prototype, {
    loaded: function() {
        this.loaded = true;
    },

    fetch: function() {
        this.loaded = false;
        this.trigger('fetch', this);

        return Backbone.Collection.prototype.fetch.apply(this, arguments);
    }
});

module.exports = Collection;
