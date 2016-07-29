/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var Backbone = require('backbone');
var $ = require('jquery');
var FWRules = require('../../../models/fwrules');
var _ = require('underscore');
var adminui = require('../../../adminui');
var FWRuleWarning = require('./rule-warning');

var FWRulesListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('./fwrules-list-item.hbs'),
    events: {
        'click .enable-rule': 'onEnableRule',
        'click .edit-rule': 'onEditRule',
        'click .disable-rule': 'onDisableRule',
        'click .delete-rule': 'onDeleteRule'
    },
    showRuleActionWarning: function (action) {
        var self = this;
        var isGlobal = this.model.attributes.global;
        var isDeleteAction = action === 'delete';

        function openWarning(doubleVerification) {
            new FWRuleWarning({
                action: action,
                isGlobal: isGlobal,
                doubleVerification: doubleVerification,
                onSubmit: function () {
                    doubleVerification ? openWarning(false) : self.trigger(action + ':rule');
                }
            }).render();
        }
        if (isDeleteAction || isGlobal) {
            openWarning(isDeleteAction && isGlobal);
            return;
        }
        this.trigger(action + ':rule');
    },
    onEnableRule: function () {
        this.showRuleActionWarning('enable');
    },
    onDisableRule: function () {
        this.showRuleActionWarning('disable');
    },
    onDeleteRule: function () {
        this.showRuleActionWarning('delete');
    },
    onEditRule: function () {
        this.trigger('edit:rule');
    },
    serializeData: function () {
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

var FWRulesList = require('../../../views/collection').extend({
    tagName: 'ul',
    attributes: {
        'class': 'list-unstyled fwrules-list'
    },
    itemView: FWRulesListItem,
    itemViewOptions: function () {
        return {
            emptyViewModel: this.collection
        };
    },
    emptyView: require('../../../views/empty').extend({
        loadingMessage: 'Loading Firewall Rules...',
        emptyMessage: 'No Firewall Rules'
    }),
    /**
     * Constructor
     * @param  {Object} options.vm VM object to scope fw rules
     * @param  {string} options.user User UUID to scope fw rules
     */
    initialize: function (options) {
        if (options.vm) {
            this.collection = new FWRules(null, {params: {vm_uuid: options.vm.get('uuid')}});
        } else if (options.user) {
            this.collection = new FWRules(null, {params: {owner_uuid: options.user}});
        } else {
            this.collection = new FWRules();
        }

        this.on('itemview:disable:rule', this.actionHandler('disable'), this);
        this.on('itemview:enable:rule', this.actionHandler('enable'), this);
        this.on('itemview:delete:rule', this.actionHandler('delete'), this);
    },
    actionHandler: function (action) {
        var self = this;

        var callback = function () {
            adminui.vent.trigger('notification', {
                level: 'success',
                message: 'Firewall rule ' + action + 'd successfully.'
            });
            self.collection.fetch({reset: true});
        };

        return function (rule) {
            rule.model.on('error', function (model, res) {
                adminui.vent.trigger('notification', {
                    level: 'error',
                    message: 'Failed to ' + action + ' rule: ' + res.statusText
                });
            }, this);
            
            if (action === 'delete') {
                $.delete_(rule.model.url(), callback);
                return;
            }
            rule.model.on('sync', callback, this);
            rule.model.set({enabled: action === 'enable'});
            rule.model.save();
        }
    },
    refresh: function () {
        this.collection.fetch({reset: true});
    },

    onShow: function () {
        this.collection.fetch();
    }
});

module.exports = FWRulesList;
