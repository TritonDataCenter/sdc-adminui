/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');

var User = require('./user');
var Collection = require('./collection');

var Users = Collection.extend({
    model: User,
    url: '/api/users',

    initialize: function(options) {
        this.options = options || {};
        this.pagingParams = {
            page: this.options.page || 1,
            per_page: this.options.per_page || 15
        };
        this.params = this.options.params || {};
    },

    userCount: function(successCb) {
        $.get('/api/users/count', function(res) {
            successCb(res.count);
        });
    },

    searchByLogin: function(login, successCb) {
        this.params = {'login': login};
        this.fetch({success: successCb});
    },

    parse: function(resp, options) {
        this.objectCount = options.xhr.getResponseHeader('x-object-count');
        if (this.objectCount) {
            this.objectCount = Number(this.objectCount);
        }
        return Backbone.Collection.prototype.parse.apply(this, arguments);
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
        return Math.ceil(this.objectCount / this.pagingParams.per_page);
    },

    hasNext: function() {
        return (this.pagingParams.page * this.pagingParams.per_page) < this.objectCount;
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
        opts.params = this.pagingParams;

        return Collection.prototype.fetch.call(this, opts);
    }
});

module.exports = Users;
