var Backbone = require('backbone');

var ServerNicsTemplate = require('../tpl/server-nics.hbs');
var ServerNicTemplate = require('../tpl/server-nic.hbs');
var ServerNic = Backbone.Marionette.ItemView.extend({
    template: ServerNicTemplate,
    tagName: 'tr',
    bindings: {
        '.mac': 'mac',
        '.ip': 'ip',
        '.netmask': 'netmask',
        '.nic_tag': 'nic_tag',
        '.vlan_id': 'vlan_id',
        '.nic_tags_provided': {
            observe: 'nic_tags_provided',
            onGet: function(tags) {
                if (tags.length) {
                    return tags.join(', ');
                }
            }
        },
        '.resolvers': {
            observe: 'resolvers',
            onGet: function(resolvers) {
                if (resolvers.length) {
                    return resolvers.join(', ');
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
    itemViewContainer: 'tbody',
    initialize: function(options) {
        this.collection = options.nics;
    }
});

module.exports = ServerNicsView;