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
var _ = require('underscore');

module.exports = Model.extend({
    idAttribute: 'uuid',
    urlRoot: '/api/fabrics/vlan/networks',
    url: function () {
        var ownerUuid = this.get('owner_uuid') || this.get('owner_uuids') && this.get('owner_uuids')[0];
        var vlanId = this.get('vlan_id');
        var uuid = this.get('uuid') || '';
        var url = this.urlRoot;
        if (vlanId || vlanId >= 0) {
            if (ownerUuid) {
                url = _.str.sprintf('/api/fabrics/%s/vlan/%s/networks/%s', ownerUuid, vlanId, uuid);
            } else {
                url = _.str.sprintf('/api/fabrics/vlan/%s/networks/%s', vlanId, uuid);
            }
        }
        return url;
    }
});

