/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var Collection = require('./collection');


var Nics = Collection.extend({
    url: '/api/nics',
    mergeSysInfo: function (sysinfo) {
        var aggrs = sysinfo['Link Aggregations'] || {};

        function _mergeSysinfo(snics, nics, kind) {
            _.each(snics, function (value, interfaceName) {
                if (aggrs[interfaceName]) {
                    return;
                }
                var mac = value['MAC Address'];
                var linkStatus = value['Link Status'];
                var params = {
                    ifname: interfaceName,
                    link_status: linkStatus,
                    ip4addr: value.ip4addr
                };
                
                var nic = nics.findWhere({'mac': mac});
                if (!nic) {
                    return;
                }
                if (value['Host Interface']) {
                    params.host_interface = value['Host Interface'];
                }
                params.kind = kind;
                nic.set(params);
            });
        }

        _mergeSysinfo(sysinfo['Network Interfaces'], this, 'nic');
        _mergeSysinfo(sysinfo['Virtual Network Interfaces'], this, 'vnic');

        return this;
    }
});
module.exports = Nics;
