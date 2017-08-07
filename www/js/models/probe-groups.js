/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var ProbeGroup = require('./probe-group');
var Backbone = require('backbone');
var _ = require('underscore');

var ProbeGroups = Backbone.Collection.extend({
    model: ProbeGroup,
    url: function() {
        return _.str.sprintf("/api/amon/probegroups/%s", this.user);
    }
});

module.exports = ProbeGroups;
