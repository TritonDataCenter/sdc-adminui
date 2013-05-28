var Backbone = require('backbone');
var _ = require('underscore');

var Collection = Backbone.Collection.extend({
    initialize: function(models, options) {
        Backbone.Collection.prototype.initialize.call(this, arguments);

        if (options && options.params) {
            this.params = options.params;
        }
        this.fetched = false;
    },
    isFetched: function() {
        return this.fetched;
    },
    fetch: function(opts) {
        opts = opts || {};
        opts.data = _.chain(this.params).clone().defaults(opts.params).value();
        delete opts.params;

        var xhr = Backbone.Collection.prototype.fetch.call(this, opts);
        var self = this;
        this.trigger('fetch:start');
        this.fetched = false;

        xhr.done(function() {
            self.trigger('fetch:done');
            self.fetched = true;
        });
        return xhr;
    }
});

module.exports = Collection;
