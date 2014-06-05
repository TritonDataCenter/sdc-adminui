var Backbone = require('backbone');
var _ = require('underscore');

var Collection = require('./collection');
var Job = require('./job');
var Jobs = Collection.extend({
    model: Job,
    url: '/api/jobs',

    initialize: function(options) {
        this.options = options || {};
        this.pagingParams = {
            page: this.options.page || 1,
            perPage: this.options.perPage || 30
        };
        this.params = this.options.params || {};
    },

    parse: function(res) {
        this.lastResultCount = res.length;
        return Collection.prototype.parse.apply(this, arguments);
    },

    firstPage: function() {
        this.pagingParams.page = 1;
    },

    next: function() {
        if (this.hasNext()) {
            this.pagingParams.page = this.pagingParams.page + 1;
        }
    },

    pages: function() {
        return Math.ceil(this.objectCount / this.pagingParams.perPage);
    },

    hasNext: function() {
        return this.lastResultCount !== 0;
    },

    hasPrev: function() {
        return this.pagingParams.page > 0;
    },

    prev: function() {
        if (this.hasPrev()) {
            this.pagingParams.page = this.pagingParams.page - 1;
        }
    },


    fetch: function(opts) {
        opts = opts || {};
        opts.params = opts.params || {};
        _.extend(opts.params, this.pagingParams);

        return Collection.prototype.fetch.call(this, opts);
    }
});

module.exports = Jobs;
