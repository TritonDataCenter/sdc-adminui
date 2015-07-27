/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var Platforms = Backbone.Collection.extend({
    url: '/api/platforms',
    parse: function(res) {
        var arr = [];
        _.each(res, function(n, d) {
            arr.push({
                version: d,
                latest: n.latest,
                label: n.latest ? d + ' (latest)' : d
            });
        });
        return arr.reverse();
    }
});

module.exports = Platforms;
