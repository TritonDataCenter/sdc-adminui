/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

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
            this.model.destroy().done(function() {
                this.trigger('destroy');
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: _.str.sprintf('Network %s deleted successfully.', this.model.get('name'))
                });
            }.bind(this));
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
