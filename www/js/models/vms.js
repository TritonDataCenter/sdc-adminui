/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

'use strict';

var _ = require('underscore');

var Vm = require('./vm');
var Collection = require('./collection');
var Promise = require('promise');

module.exports = Collection.extend({
    model: Vm,

    url: '/api/vms',

    initialize: function (models, options) {
        this.options = options || {};
        this.pagingParams = {
            page: this.options.page || 1,
            perPage: this.options.perPage || 15
        };
    },

    parse: function (resp, options) {
        this.objectCount = options.xhr.getResponseHeader('x-object-count');
        if (this.objectCount) {
            this.objectCount = Number(this.objectCount);
        }
        return Collection.prototype.parse.apply(this, arguments);
    },

    firstPage: function () {
        this.pagingParams.page = 1;
    },

    next: function () {
        if (this.hasNext()) {
            this.pagingParams.page = this.pagingParams.page + 1;
        }
    },

    pages: function () {
        return Math.ceil(this.objectCount / this.pagingParams.perPage);
    },

    hasNext: function () {
        return (this.pagingParams.page * this.pagingParams.perPage) < this.objectCount;
    },

    hasPrev: function () {
        return this.pagingParams.page > 0;
    },

    prev: function () {
        if (this.hasPrev()) {
            this.pagingParams.page = this.pagingParams.page - 1;
        }
    },
    exportGroupedByCustomer: function () {
        var collection = this;
        return new Promise(function (resolve, reject) {
            collection.fetch({url: '/api/vms/groupedByCustomer'}).done(function (res) {
                resolve(res);
            });
        });
    },

    fetch: function (opts) {
        opts = opts || {};
        opts.params = opts.params || {};
        _.extend(opts.params, this.pagingParams);

        return Collection.prototype.fetch.call(this, opts);
    }
});
