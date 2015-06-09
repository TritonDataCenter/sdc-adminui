/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');
var Model = require('./model');

module.exports = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/api/fabrics/vlan/networks',
    url: function () {
        var owner_uuid = this.get('owner_uuid');
        var vlan_id = this.get('vlan_id');
        var uuid = this.get('uuid');
        if (owner_uuid && uuid && vlan_id || vlan_id >= 0) {
            return _.str.sprintf('/api/fabrics/%s/vlan/%s/networks/%s', owner_uuid, vlan_id, uuid);
        } else if (uuid && vlan_id || vlan_id >= 0) {
            return _.str.sprintf('/api/fabrics/vlan/%s/networks/%s', vlan_id, uuid);
        }
        return this.urlRoot;
    }
});

