/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../../../adminui');

var sprintf = _.str.sprintf;
var FWRule = require('../../../models/fwrule');
var FWRuleWarning = require('./rule-warning');

var FWRulesForm = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'fwrules-form'
    },

    events: {
        'submit form': 'onSubmit',
        'click button[type=submit]': 'onSubmit',
        'click button.cancel': 'onDismiss',
        'mousedown div.checkbox.enabled label': 'onRuleWarning'
    },

    modelEvents: {
        'sync': 'onSync',
        'error': 'onError'
    },

    template: require('./fwrules-form.hbs'),

    initialize: function (options) {
        if (!options.model) {
            this.model = new FWRule();
        }
        if (options.vm && options.vm.get('owner_uuid')) {
            this.model.set({owner_uuid: options.vm.get('owner_uuid')});
        } else if (options.user) {
            this.model.set({owner_uuid: options.user});
        }
        if (this.model.isNew()) {
            if (options.vm) {
                this.model.set({rule: 'FROM any TO vm '+options.vm.get('uuid') + ' ALLOW '});
            } else if (options.user) {
                this.model.set({rule: 'FROM any TO all vms ALLOW '});
            }
        }
    },

    onRender: function () {
        var data = this.model.toJSON();
        _.extend(data, this.model.tokenizeRule());
        Backbone.Syphon.deserialize(this, data);
        var node = this.$('.form-group-global');
        if (data.uuid) {
            node.hide();
        }
    },
    onError: function (model, xhr) {
        var errors = xhr.responseData.errors;
        if (xhr.responseData.errors) {
            var messages = _.pluck(errors, 'message');
            window.alert("Error Saving Firewall Rule \n" + messages.join("\n"));
        }
    },

    onShow: function () {
        var $el = this.$el;
        $el.hide().slideDown(200, function () {
            $el.find('input:first').focus();
        });
    },

    onDismiss: function () {
        this.trigger('close');
    },

    onRuleWarning: function (event) {
        if (this.model.attributes.global) {
            var target = event.target.control || event.target;
            var isChecked = target.checked;
            var action = isChecked ? 'disable' : 'enable';
            new FWRuleWarning({
                action: action,
                isGlobal: true,
                onSubmit: function () {
                    target.checked = !isChecked;
                }
            }).render();
        }
    },

    close: function () {
        var self = this;
        this.$el.slideUp(200, function () {
            Backbone.Marionette.ItemView.prototype.close.call(self);
        });
    },

    onSync: function () {
        adminui.vent.trigger('notification', {
            level: 'success',
            message: "Firewall rule saved successfully."
        });

        this.trigger('rule:saved');
        this.trigger('close');
    },

    onSubmit: function (e) {
        e.preventDefault();

        var data = Backbone.Syphon.serialize(this);
        var rule = sprintf(
            'FROM %s TO %s %s %s',
            data.fromPredicate,
            data.toPredicate,
            data.action,
            data.actionPredicate
        );
        this.model.set({
            global: data.global,
            enabled: data.enabled,
            rule: rule,
            owner_uuid: data.owner_uuid
        });
        this.model.save();
    }
});

module.exports = FWRulesForm;
