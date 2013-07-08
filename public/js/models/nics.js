var Backbone = require('backbone');
var _ = require('underscore');
var Collection = require('./collection');


var Nics = Collection.extend({
    url: '/_/nics',
    mergeSysinfo: function(sysinfo) {
        _mergeSysinfo(sysinfo['Network Interfaces'], this, 'nic');
        _mergeSysinfo(sysinfo['Virtual Network Interfaces'], this, 'vnic');
        return this;

        function _mergeSysinfo(snics, nics, kind) {
            _.each(snics, function(n, nicName) {
                var mac = n['MAC Address'];
                var nic = nics.findWhere({'mac': mac});
                var linkStatus = n['Link Status'];
                var params = {
                    name: nicName,
                    link_status: linkStatus
                };
                if (nic['Host Interface']) {
                    params.host_interface = nic['Host Interface'];
                }
                params.kind = kind;

                nic.set(params);
            });
        }
    }
});
module.exports = Nics;
