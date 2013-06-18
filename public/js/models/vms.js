var Backbone = require('backbone');
var _ = require('underscore');

var Vm = require('./vm');
var Collection = require('./collection');

module.exports = Collection.extend({
    model: Vm,

    url: "/_/vms",

    initialize: function(models, options) {
        this.options = options || {};
        this.pagingParams = {
            page: this.options.page || 1,
            perPage: this.options.perPage || 15
        };
    },

    parse: function(resp, options) {
        this.objectCount = options.xhr.getResponseHeader('x-object-count');
        if (this.objectCount) {
            this.objectCount = Number(this.objectCount);
        }
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
        return (this.pagingParams.page * this.pagingParams.perPage) < this.objectCount;
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
