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

var NotFoundView = Backbone.Marionette.Layout.extend({
    template: require('./not-found.hbs'),
    serializeData: function() {
        this.options = this.options || {};
        var data = JSON.stringify(this.options, null, 2);
        return data;
    }
});

module.exports = NotFoundView;
