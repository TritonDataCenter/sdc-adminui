/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Alarm = require('./alarm');
var Backbone = require('backbone');
var moment = require('moment');

module.exports = Backbone.Collection.extend({
    model: Alarm,
    url: '/api/amon/alarms',

    parse: function(resp) {
        var data = Backbone.Model.prototype.parse.call(this, resp);
        if (data.timeOpened) {
            data.timeOpened = new Date(data.timeOpened);
        }
        if (data.timeClosed) {
            data.timeClosed = new Date(data.timeClosed);
        }
        if (data.timeLastEvent) {
            data.timeLastEvent = new Date(data.timeLastEvent);
        }
        return data;
    },

    fetchAlarms: function(userUuid) {
        var params = $.param({user: userUuid});
        this.fetch({ data: params });
    }
});
