var Backbone = require('backbone');
var ItemTemplate = require('../tpl/vms-list-item.hbs');
var adminui = require('../adminui');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: ItemTemplate,

    events: {
        'click .alias a': 'navigateToVmDetails'
    },

    navigateToVmDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'vm', { vm: this.model });
    }
});

module.exports = require('./collection').extend({
    itemView: ItemView,
    emptyView: require('./empty').extend({
        loadingMessage: 'Loading Virtual Machines...',
        emptyMessage: 'No Virtual Machines found',
        columns: 4
    }),
    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    }
});
