/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var Backbone = require('backbone');

var Note = require('./note');


var Notes = module.exports = Backbone.Collection.extend({
    model: Note,
    url: function() {
        return '/api/notes/' + this.item_uuid;
    },
    parse: function(col) {
        return _.map(col, function(obj) {
            obj.created = new Date(obj.created);
            return obj;
        });
    }
});
