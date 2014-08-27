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

var Sync = Backbone.sync;

var Model = Backbone.Model.extend({
    sync: function(method, model, options) {
        options.error = function(xhr, err, statusText) {
            var contentType = xhr.getResponseHeader('content-type');
            if (contentType === 'application/json') {
                xhr.responseData = jQuery.parseJSON(xhr.responseText);
            }
            model.trigger('error', model, xhr, options);
        };
        return Backbone.sync.apply(this, arguments);
    }
});

module.exports = Model;
