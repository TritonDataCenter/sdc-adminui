/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Collection = require('./collection');
var FabricsVlan = require('./fabrics-vlan');
var FabricsVlans = Collection.extend({
    model: FabricsVlan,
    url: function () {
        var owner_uuid = this.get('owner_uuid') || this.params.owner_uuid;
        if (owner_uuid) {
            return '/api/fabrics/' + owner_uuid + '/vlans';
        }
        return '/api/fabrics'
    }
});

module.exports = FabricsVlans;
