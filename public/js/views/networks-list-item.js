var Backbone = require('backbone');
var NetworksListItemTemplate = require('../tpl/networks-list-item.hbs');
var NetworksListItem = Backbone.Marionette.ItemView.extend({
    template: NetworksListItemTemplate,
    tagName: 'li',
    initialize: function(options) {
        this.showDelete = options.showDelete || false;
    },

    events: {
        'click .delete-network': 'onClickDeleteNetwork',
        'click .name a': 'select'
    },

    onClickDeleteNetwork: function() {
        var confirm = window.confirm('Are you sure you want to delete this network?');
        if (confirm) {
            this.model.destroy();
        }
    },

    serializeData: function() {
        var data = this.model.toJSON();
        data.show_delete = this.showDelete;
        return data;
    },

    select: function() {
        this.trigger('select', this.model);
    }
});

module.exports = NetworksListItem;
