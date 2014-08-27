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
var Collection = require('./collection');


var Nics = Collection.extend({
    url: '/api/nics',
    mergeSysinfo: function(sysinfo) {
        _mergeSysinfo(sysinfo['Network Interfaces'], this, 'nic');
        _mergeSysinfo(sysinfo['Virtual Network Interfaces'], this, 'vnic');
        return this;

        function _mergeSysinfo(snics, nics, kind) {
            console.log('napi nics', nics);
            _.each(snics, function(n, nicName) {
                var mac = n['MAC Address'];
                var linkStatus = n['Link Status'];
                var params = {
                    name: nicName,
                    link_status: linkStatus
                };
                var nic = nics.findWhere({'mac': mac});
                if (n['Host Interface']) {
                    params.host_interface = n['Host Interface'];
                }
                params.kind = kind;

                nic.set(params);
            });
        }
    }
});
module.exports = Nics;
