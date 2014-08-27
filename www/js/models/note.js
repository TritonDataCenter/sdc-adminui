/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');


var Note = Backbone.Model.extend({
    idAttribute: 'uuid',
    urlRoot: function() {
        return '/api/notes/' + this.item_uuid;
    },
    initialize: function(options) {
        this.item_uuid = options.item_uuid;
    }
});

module.exports = Note;
