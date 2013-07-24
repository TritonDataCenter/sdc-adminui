var Backbone = require('backbone');
var Networks = require('../models/networks');
var NetworkPools = require('../models/network-pools');
var settings = require('../models/settings');
var app = require('../adminui');

var SettingsView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/settings.hbs'),
    sidebar: 'settings',
    url: '/settings',
    events: {
        'change .networks-select select': 'onSelectNetwork',
        'click button.save': 'saveSettings'
    },
    initialize: function() {
        var self = this;
        this.model = settings;
        this.networks = new Networks();
        this.networkPools = new NetworkPools();

        $.when(
            this.model.fetch(),
            this.networks.fetch({data: {provisionable_by: null }}),
            this.networkPools.fetch({data: {provisionable_by: null }})
        ).then(function() {
            var networkPresets = self.model.get('provision.preset_networks') || [];

            while (networkPresets.length < 4) {
                networkPresets.push(null);
            }

            _.each(networkPresets, function(uuid) {
                self.createNetworkSelect(uuid);
            })

            var values = self.extractFormValues();
            self.populatePrimaryNetworks(values.networks);
        });
    },
    extractFormValues: function() {
        var networksChecked = this.$('.networks-select select').map(function() { return $(this).val(); });
        var primaryNetwork = this.$('.primary-network-select select').val();
        var values = {};
        values.networks = _.map(_.compact($.makeArray(networksChecked)), function(nuuid) {
            var net = { uuid: nuuid };
            if (nuuid === primaryNetwork) {
                net.primary = true;
            }

            return net;
        });
        return values;
    },
    onSelectNetwork: function() {
        var values = this.extractFormValues();
        this.populatePrimaryNetworks(values.networks);
    },
    createNetworkSelect: function(uuid) {
        var $select = $('<select data-placeholder="Select a Network" name="networks[]"></select>');
        $select.append("<option></option>");

        var $optgroup = $('<optgroup />').attr('label', 'Networks');
        this.networks.each(function(n) {
            var $elm = $("<option />").attr('value', n.get('uuid'));

            if (uuid === n.get('uuid')) {
                $elm.prop('selected', true);
            }

            if (n.get('subnet')) {
                $elm.html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                $elm.html(n.get('name'));
            }
            $optgroup.append($elm);
        });

        $select.append($optgroup);

        var $optgroup2 = $('<optgroup />').attr('label', 'Network Pools');
        this.networkPools.each(function(n) {
            var $elm = $("<option />").attr('value', n.get('uuid'));
            if (n.get('subnet')) {
                $elm.html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                $elm.html(n.get('name'));
            }
            if (uuid === n.get('uuid')) {
                $elm.prop('selected', true);
            }
            $optgroup.append($elm);
        });
        $select.append($optgroup2);
        $select.show();

        this.$('.networks-select .chosen').append($select);
        $select.chosen({allow_single_deselect: true });
        this.$('.control-group-networks').show();
    },

    populatePrimaryNetworks: function(selectedNets) {
        var $select = this.$('.primary-network-select select');
        var networks = this.networks;
        var networkPools = this.networkPools;
        var settings = this.model;

        $select.empty();

        _.each(selectedNets, function(net) {
            var n = networks.get(net.uuid) || networkPools.get(net.uuid);
            var $elm = $("<option />").attr('value', n.get('uuid'));
            if (n.get('subnet')) {
                $elm.html([n.get('name'), n.get('subnet')].join(' - '));
            } else {
                $elm.html(n.get('name'));
            }
            if (settings.get('provision.preset_primary_network') == net.uuid) {
                $elm.prop('selected', true);
            }
            $select.append($elm);
        });
    },
    saveSettings: function() {
        var networks = this.$('.networks-select select').map(function() { return $(this).val(); });
        var primaryNetwork = this.$('.primary-network-select select').val();

        var values = {
            'provision.preset_networks': _.compact($.makeArray(networks)),
            'provision.preset_primary_network': primaryNetwork
        }
        this.model.save(values).done(function() {
            app.vent.trigger('notification', {
                level: 'success',
                message: 'Settings saved successfully.'
            });
        });
    }
});


module.exports = SettingsView;
