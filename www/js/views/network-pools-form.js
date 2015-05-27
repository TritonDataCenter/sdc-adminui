/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var _ = require('underscore');
var Backbone = require('backbone');

var Networks = require('../models/networks');
var NetworkPool = require('../models/network-pool');
var Template = require('../tpl/network-pools-form.hbs');

var TypeaheadUser = require('./typeahead-user');

module.exports = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'network-pools-create',
    attributes: {
        'class': 'modal'
    },

    ui: {
        'ownerInput': 'input[name="owner_uuids[]"]',
        'nameInput': 'input[name=name]',
        'saveButton': 'button.save'
    },

    events: {
        'input input': 'checkInput',
        'change select': 'checkInput',
        'blur input[name="owner_uuids[]"]': 'onBlurOwnerField',
        'focus input[name="owner_uuids[]"]': 'onFocusOwnerField',
        'submit form': 'onSubmit'
    },

    initialize: function (options) {
        options = options || {};
        this.networks = options.networks || new Networks();
        this.model = this.networkPool = options.networkPool || new NetworkPool();
        this.userInput = new TypeaheadUser({showPreview: true});

        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.listenTo(this.networks, 'sync', this.render);
        this.listenTo(this.networkPool, 'sync', this.onSaved);
        this.listenTo(this.networkPool, 'error', this.onSyncError);

        this.selectedUser = null;
    },

    checkInput: function () {
        if (this.validNetworks() && this.validPoolName()) {
            this.enableSaveButton();
        } else {
            this.disableSaveButton();
        }
    },

    validPoolName: function () {
        var val = this.$('input[name=name]').val();
        return (val.length > 0);
    },

    validNetworks: function () {
        var val = this.$('select').val();

        if (val === null || val.length === 0) {
            return false;
        } else {
            return true;
        }
    },

    enableSaveButton: function () {
        this.$('button.save').prop('disabled', false);
    },

    disableSaveButton: function () {
        this.$('button.save').prop('disabled', true);
    },

    serializeData: function () {
        var networkPool = this.networkPool.toJSON();
        var networks = this.networks.toJSON();

        if (networkPool.networks) {
            _.each(networks, function (d) {
                if (networkPool.networks.indexOf(d.uuid) !== -1) {
                    d.selected = true;
                }
            });
        }
        return {
            networkPool: networkPool,
            networks: networks
        };
    },

    onFocusOwnerField: function (e) {
        this.selectedUser = null;
    },

    onSyncError: function (model, xhr) {
        var ul = $('<ul />');
        this.$('.control-group').removeClass('error');

        _(xhr.responseData.errors).each(function(e) {
            this.$('[name='+e.field+']').parents('.control-group').addClass('error');
            ul.append('<li>'+e.message+' (' + e.field + ')</li>');
        });

        this.$('.alert')
            .empty()
            .append('<h4 class="alert-heading">Please fix the following errors</h4>')
            .append(ul)
            .show();
    },

    onBlurOwnerField: function (e) {
        /*
         * prevent the user from de-focusing on the field if the user never selected
         * a user from the dropdown
         */
        var $field = this.ui.ownerInput;
        if ($field.val().length === 0) {
            this.selectedUser = null;
        } else {
            if (! this.selectedUser) {
                e.stopImmediatePropagation();
                e.preventDefault();
                $field.focus();
            }
        }
    },

    onSelectUser: function (user) {
        this.selectedUser = user;
    },

    onSubmit: function (e) {
        e.preventDefault();
        this.$('.alert').hide();
        var data = Backbone.Syphon.serialize(this);
        data.owner_uuids = _.compact(data.owner_uuids);
        this.networkPool.set(data);
        this.networkPool.save();
    },

    onSaved: function () {
        this.trigger('saved', this.networkPool);
    },

    onRender: function () {
        this.userInput.setElement(this.ui.ownerInput);
        this.userInput.render();
        this.ui.saveButton.prop('disabled', true);
        this.stickit(this.networkPool, {
            'input[name=name]': 'name',
            'input[name="owner_uuids[]"]': 'owner_uuids'
        });
        this.$('select').chosen({
            width: '280px'
        });
    },

    show: function() {
        this.render();
        this.$el.modal();
        this.$('input:first').focus();
    },

    onClose: function() {
        this.$el.modal('hide').remove();
    }
});
