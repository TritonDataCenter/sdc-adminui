var Backbone = require('backbone');

var ServerNicsTemplate = require('../tpl/server-nics.hbs');
var ServerNicTemplate = require('../tpl/server-nic.hbs');

var valOrDash = function(val) {
    if (val && val.length) {
        return val;
    } else {
        return '–';
    }
};

var ServerNic = Backbone.Marionette.ItemView.extend({
    template: ServerNicTemplate,
    tagName: 'li',
    bindings: {
        ':el': {
            attributes: [{
                observe: 'link_status',
                name: 'class'
            }]
        },
        '.link-status': {
            attributes: [{
                observe: 'link_status',
                name: 'class'
            }]
        },
        '.name': 'name',
        '.mac': 'mac',
        '.ip': {
            observe: 'ip',
            onGet: valOrDash
        },
        '.netmask': {
            observe: 'netmask',
            onGet: valOrDash
        },
        '.nic-tag': {
            observe: 'nic_tag',
            onGet: valOrDash
        },
        '.vlan-id': {
            observe: 'vlan_id',
            onGet: valOrDash
        },
        '.nic-tags-provided': {
            observe: 'nic_tags_provided',
            onGet: valOrDash
        },
        '.resolvers': {
            observe: 'resolvers',
            onGet: function(resolvers) {
                if (resolvers.length) {
                    return resolvers.join(', ');
                } else {
                    return '&#8212';
                }
            }
        }
    },
    onRender: function() {
        this.stickit();
    }
});

var ServerNicsView = Backbone.Marionette.CompositeView.extend({
    template: ServerNicsTemplate,
    itemView: ServerNic,
    itemViewContainer: 'ul',
    initialize: function(options) {
        this.collection = options.nics;
    }
});

module.exports = ServerNicsView;
