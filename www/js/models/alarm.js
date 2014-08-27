/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var Alarm = Backbone.Model.extend({
    urlRoot: function() {
        return '/api/amon/alarms/' + this.get('user');
    },
    idAttribute: 'id',
    suppress: function(cb) {
        $.post(this.url() + '?action=suppress', {}, cb);
    }
});

module.exports = Alarm;