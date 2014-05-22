var Backbone = require('backbone');
var adminui = require('adminui');
var NetworksListItemTemplate = require('../tpl/networks-list-item.hbs');
var _ = require('underscore');

var NetworksListItem = Backbone.Marionette.ItemView.extend({
    template: NetworksListItemTemplate,

    tagName: 'li',

    initialize: function(options) {
        this.showDelete = options.showDelete || false;
    },

    events: {
        'click .delete-network': 'onClickDeleteNetwork',
        'mouseover .delete-network': 'onMouseoverDeleteNetwork',
        'mouseout .delete-network': 'onMouseoutDeleteNetwork',
        'click .name a': 'select'
    },

    onMouseoverDeleteNetwork: function() {
        this.$el.addClass('hover');
    },
    onMouseoutDeleteNetwork: function() {
        this.$el.removeClass('hover');
    },

    onClickDeleteNetwork: function() {
        var confirm = window.confirm(
            _.str.sprintf('Are you sure you want to delete the network "%s" ?', this.model.get('name'))
        );
        if (confirm) {
            this.trigger('destroy');
            this.model.destroy();
            adminui.vent.trigger('notification', {message: 'Network deleted.'});
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
