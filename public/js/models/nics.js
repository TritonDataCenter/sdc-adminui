var Backbone = require('backbone');
var _ = require('underscore');


var Nics = Backbone.Collection.extend({
    url: '/_/nics',
    initialize: function(options) {
        this.belongs_to_type = options.belongs_to_type;
        this.belongs_to_uuid = options.belongs_to_uuid;
    },
    mergeSysinfo: function(sysinfo) {
        _mergeSysinfo(sysinfo['Network Interfaces'], this);
        _mergeSysinfo(sysinfo['Virtual Network Interfaces'], this);
        return this;

        function _mergeSysinfo(snics, nics) {
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

                nic.set(params);
            });
        }
    },

    fetchNics: function() {
        var query = {};

        if (this.belongs_to_uuid) {
            query.belongs_to_uuid = this.belongs_to_uuid;
        }

        if (this.belongs_to_type) {
            query.belongs_to_type = this.belongs_to_type;
        }

        this.fetch({
            data: query
        });
    }
});
module.exports = Nics;
