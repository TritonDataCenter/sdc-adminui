/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var $ = require('jquery');
var FWRules = require('../models/fwrules');
var adminui = require('../adminui');
var _ = require('underscore');

var FWRulesListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/fwrules-list-item.hbs'),
    events: {
        'click .enable-rule': 'onEnableRule',
        'click .edit-rule': 'onEditRule',
        'click .disable-rule': 'onDisableRule',
        'click .delete-rule': 'onDeleteRule'
    },
    onEnableRule: function() {
        this.trigger('enable:rule');
    },
    onDisableRule: function() {
        this.trigger('disable:rule');
    },
    onDeleteRule: function() {
        this.trigger('delete:rule');
    },
    onEditRule: function() {
        this.trigger('edit:rule');
    },

    serializeData: function() {
        var rule = this.model.tokenizeRule();
        var vars = this.model.toJSON();

        if (vars.fromPredicate === ('vm ' + this.model.collection.params.vm_uuid)) {
            vars.fromPredicate = 'THIS VM';
        }
        _.extend(vars, rule);

        vars.enabled = this.model.get('enabled');
        vars.owner_uuid = this.model.get('owner_uuid');
        return vars;
    }
});

var FWRulesList = require('./collection').extend({
    tagName: 'ul',
    attributes: {
        'class': 'list-unstyled fwrules-list'
    },

    itemView: FWRulesListItem,

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    emptyView: require('./empty').extend({
        loadingMessage: 'Loading Firewall Rules...',
        emptyMessage: 'No Firewall Rules'
    }),

    /**
     * Constructor
     * @param  {Object} options.vm VM object to scope fw rules
     */
    initialize: function(options) {
        if (options.vm) {
            this.collection = new FWRules(null, {params: { vm_uuid: options.vm.get('uuid') }});
        } else {
            this.collection = new FWRules();
        }

        this.on('itemview:disable:rule', function(iv) {
            iv.model.on('sync', function() {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: "Firewall rule disabled successfully."
                });
                this.collection.fetch({reset: true});
            }, this);
            iv.model.set({enabled: false});
            iv.model.save();
        }, this);

        this.on('itemview:enable:rule', function(iv) {
            iv.model.on('sync', function() {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: "Firewall rule enabled successfully."
                });
                this.collection.fetch({reset: true});
            }, this);
            iv.model.set({enabled: true});
            iv.model.save();
        }, this);

        var self = this;
        this.on('itemview:delete:rule', function(iv) {
            $.delete_(iv.model.url(), function(data) {
                adminui.vent.trigger('notification', {
                    level: 'success',
                    message: "Firewall rule deleted successfully."
                });
                self.collection.fetch({reset: true});
            });
        }, this);
    },


    onShow: function() {
        this.collection.fetch();
    }
});

module.exports = FWRulesList;
