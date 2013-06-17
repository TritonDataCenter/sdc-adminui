var Backbone = require('backbone');
var _ = require('underscore');

var Collection = Backbone.Collection.extend({
    constructor: function(models, options) {
        Backbone.Collection.apply(this, arguments);

        options = options || {};

        if (options && options.params) {
            this.params = options.params;
        } else {
            this.params = {};
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
