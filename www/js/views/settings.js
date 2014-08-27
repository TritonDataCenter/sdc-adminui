/** @jsx React.DOM **/

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */
var Backbone = require('backbone');
var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');
var MultipleNicConfigComponent = require('../components/multi-nic-config');
var settings = require('../models/settings');
var app = require('../adminui');

var React = require('react');
var _ = require('underscore');




var SettingsView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/settings.hbs'),
    sidebar: 'settings',
    url: '/settings',
    attributes: {
        'id': 'page-settings'
    },
    events: {
        'click button.save': 'saveSettings'
    },
    initialize: function() {
        var self = this;
        this.model = settings;
    },
    onShow: function() {
        var self = this;
        $.when(
            this.model.fetch()
        ).then(function() {
            var networkPresets = self.model.get('provision.preset_networks') || [];
            if (networkPresets.length > 0) {
                networkPresets = networkPresets.map(function(n) {
                    if (typeof(n) === 'string') {
                        return {network_uuid: n};
                    } else {
                        return n;
                    }
                });
                console.log(networkPresets);
                self.component.setState({nics: networkPresets});
            }
        });
    },
    onRender: function() {
        this.component = <MultipleNicConfigComponent networksFilter={{provisionable_by: null}} />;
        React.renderComponent(this.component, this.$('.nic-selection-container').get(0));
    },

    saveSettings: function() {
        var networks = _.clone(this.component.state.nics);

        var values = { 'provision.preset_networks': networks };

        this.model.save(values).done(function() {
            app.vent.trigger('notification', {
                level: 'success',
                message: 'Settings saved successfully.'
            });
        });
    }
});


module.exports = SettingsView;
