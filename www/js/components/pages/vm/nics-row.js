/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var adminui = require('../../../adminui');

/**
 * Events
 *
 * nic:configure (nic)
 * nic:select (nic)
 * nic:deselect (nic)
 */
var NicsRowView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('./nics-row.hbs'),

    events: {
        'change input': 'onSelect',
        'click .network-name': 'gotoNetwork',
        'click .configure-nic': 'onConfigureNic'
    },

    gotoNetwork: function() {
        adminui.vent.trigger('showview', 'network', {model: this.network});
    },

    onConfigureNic: function() {
        this.trigger('nic:configure', this.model);
    },

    serializeData: function() {
        var data = this.model.toJSON();
        if (this.network) {
            data.network_name = this.network.get('name');
        }
        return data;
    },

    onSelect: function(e) {
        var checked = this.$('input').is(':checked');

        if (checked) {
            this.$el.addClass('selected');
            this.trigger('nic:select', this.model);
        } else {
            this.$el.removeClass('selected');
            this.trigger('nic:deselect', this.model);
        }
    }
});

module.exports = NicsRowView;
