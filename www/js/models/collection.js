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
        opts.params = opts.params || {};
        opts.data = _.chain(opts.params).clone().defaults(this.params).value();
        delete opts.params;

        var xhr = Backbone.Collection.prototype.fetch.call(this, opts);
        var self = this;
        this.trigger('fetch:start');
        this.fetched = false;

        xhr.done(function() {
            self.fetched = true;
            self.trigger('fetch:done');
        });
        return xhr;
    }
});

module.exports = Collection;
