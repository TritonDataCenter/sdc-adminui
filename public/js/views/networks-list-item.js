var Backbone = require('backbone');
var NetworksListItemTemplate = require('../tpl/networks-list-item.hbs');
var NetworksListItem = Backbone.Marionette.ItemView.extend({
    template: NetworksListItemTemplate,
    tagName: 'li',

    events: {
        'click .name a': 'select'
    },

    select: function() {
        this.trigger('select', this.model);
    }
});

module.exports = NetworksListItem;
