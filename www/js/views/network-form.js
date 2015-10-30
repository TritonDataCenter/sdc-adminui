/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2015, Joyent, Inc.
 */

var Backbone = require('backbone');

require('backbone.syphon');

var _ = require('underscore');
var $ = require('jquery');
var adminui = require('../adminui');

var Template = require('../tpl/networks-form.hbs');
var Network = require('../models/network');
var NicTags = require('../models/nictags');
var TypeaheadUserInput = require('./typeahead-user');
var FabricVlans = require('../models/fabrics-vlans');
var utils = require('../lib/utils');

var NicTagSelectItem = Backbone.View.extend({
    tagName: 'option',
    render: function() {
        var name = this.model.get('name');
        this.$el.text(name);
        this.$el.attr("value", name);
    }
});

var CreateNicTagView = require('./create-nic-tag');

var View = Backbone.Marionette.Layout.extend({
    regions: {
        'createNicTagRegion': '.create-nic-tag-region'
    },
    template: Template,
    id: 'network-form',

    events: {
        'submit form': 'onSubmit',
        'click .save': 'onSubmit',
        'click .create-new-nic-tag': 'onClickCreateNewNicTag',
        'click .add-route': 'onAddRoute',
        'click .remove-route': 'onRemoveRoute',
        'click a.add-owner-entry': 'onAddOwnerEntry',
        'change .fabric-network': 'onChangeFabric',
        'click button[type=cancel]': 'onCancel'
    },

    ui: {
        'alert': '.alert',
        'nicTagSelect': 'select[name=nic_tag]',
        'newNicTagForm': '.nic-tag-form',
        'createNewNicTagButton': '.create-new-nic-tag'
    },

    initialize: function (options) {
        this.options = options || {};
        if (!this.model) {
            this.model = new Network();
        }
        if (this.options.isFabric) {
            this.fabrics = new FabricVlans();
        } else {
            this.nicTags = new NicTags();
            this.nicTagsSelect = new Backbone.Marionette.CollectionView({
                itemView: NicTagSelectItem,
                collection: this.nicTags
            });
        }
    },

    onChangeFabric: function (e) {
        $('.network-mtu').prop('readonly', e.target.checked).val('');
        $('select[name=nic_tag]').prop('disabled', e.target.checked).val('');
    },

    onCancel: function (e) {
        e.preventDefault();
        var options = this.options;
        var view = 'networking';
        if (!options.tab) {
            var fromVlan = options.isFabric && typeof this.model.get('vlan_id') === 'number';
            view = this.model.isNew() ? (fromVlan ? 'fabric-vlan' : 'networking') : 'network';
            options.model = fromVlan ? options.data : this.model;
        }
        adminui.vent.trigger('showview', view, options);
    },

    onClickCreateNewNicTag: function () {
        var self = this;
        this.ui.nicTagSelect.hide();
        this.ui.createNewNicTagButton.hide();

        var createNicTagView = new CreateNicTagView();
        this.createNicTagRegion.show(createNicTagView);
        createNicTagView.on('save', function (tag) {
            self.nicTags.fetch().done(function () {
                self.ui.nicTagSelect.val(tag.get('name'));
                self.ui.nicTagSelect.show();
                self.ui.createNewNicTagButton.show();
            });
        });
        createNicTagView.on('close', function () {
            self.ui.nicTagSelect.show();
            self.ui.createNewNicTagButton.show();
        });
    },

    onSaved: function () {
        adminui.vent.trigger('showview', 'network', {model: this.model});
        adminui.vent.trigger('notification', {
            level: 'success',
            message: _.str.sprintf('Network <strong>%s</strong> %s successfully.', this.model.get('name'), this.model.isNew() || this.options.isFabric ? 'created' : 'updated')
        });
    },

    onSubmit: function (e) {
        e.preventDefault();
        var self = this;
        var data = Backbone.Syphon.serialize(this);
        data.owner_uuids = _.compact(data.owner_uuids);
        data.resolvers = data.resolvers.split(" ");
        var errors = null;
        if (!data.name) {
            errors = [{field: 'name', message: 'must not be empty'}];
        } else if (data.name.length > 64) {
            errors = [{field: 'name', message: 'must not be longer than 64 characters'}];
        }

        var routes = {};
        _.each(data.routes, function(data) {
            if (data.subnet.length && data.gateway.length) {
                routes[data.subnet] = data.gateway;
            }
        });
        utils.setOwnerData(data);

        var mtu = data.mtu;
        if (mtu !== '') {
            data.mtu = /^[0-9]+$/.test(mtu) ? parseInt(mtu, 10) : mtu;
        } else {
            if (this.model.has('mtu')) {
                this.model.unset('mtu');
            }
            delete data.mtu;
        }

        data.routes = routes;
        data.nic_tag = this.$('select[name=nic_tag]').val();

        if (this.options.isFabric) {
            var vlan = this.options.data || {};
            data.vlan_id = vlan.vlan_id || this.$('select[name=vlan_id]').val();
            data.owner_uuid = data.owner_uuids[0] || data.owner_uuid;
            if (data['fabric-network']) {
                data = _.extend(data, {
                    fabric: true
                });
                if (!data.owner_uuid) {
                    errors = errors || [];
                    errors.push({field: 'owner_uuids[]', message: 'must not be empty'});
                }
                if (!data.vlan_id) {
                    errors = errors || [];
                    errors.push({field: 'vlan_id', message: 'must not be empty'});
                }
            } else {
                this.model = new Network();
            }
        }
        if (errors) {
            this.showError(errors);
            return;
        }
        this.model.set(data);
        this.model.save().done(self.onSaved.bind(self)).fail(self.onError.bind(self));
    },

    onError: function (xhr) {
        this.showError(xhr.responseData.errors);
    },

    showError: function (errors) {
        $('.form-group').removeClass('has-error');
        var ul = $('<ul />');
        _(errors).each(function (error) {
            var $field = this.$('[name="' + error.field + '"]');
            $field.parents('.form-group').addClass('has-error').find('.text-danger').remove();
            if (error.message) {
                $field.after($('<div class="help-block text-danger">').html(error.message));
            }
        }, this);

        this.ui.alert.find('.error').html('Invalid parameters');
        this.ui.alert.show();
    },

    onAddRoute: function () {
        var l = $('.routes-controls').length.toString();
        var controls = $('.routes-controls:last').clone();
        $('input:first', controls).attr('name', 'routes[' + l + '][subnet]').val('');
        $('input:last', controls).attr('name', 'routes[' + l + '][gateway]').val('');
        $('.routes-controls:last').after(controls);
        $('.remove-route', controls).show();
    },

    onRemoveRoute: function (e) {
        $(e.currentTarget).parent('.routes-controls').remove();
    },

    serializeData: function () {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        if (data.uuid) {
            data.inUse = this.options.inUse || false;
        } else {
            data.inUse = false;
        }
        data.isNotFabric = data.isNotFabric || !this.options.isFabric;
        if (this.options.isFabric) {
            var optionsData = this.options.data || {};
            data.owner_uuid = optionsData.owner_uuid;
            data.isFabric = true;
            data.vlan_id = optionsData.vlan_id;
            data.vlans = optionsData.vlans;
            data.internet_nat = data.hasOwnProperty('internet_nat') ? data.internet_nat : true;
            _.extend(this.model.attributes, data);
        }
        var routes = data.routes;
        data.routes = [];
        for (var subnet in routes) {
            data.routes.push({subnet: subnet, gateway: routes[subnet]});
        }
        data.resolvers = (this.model.get('resolvers') || []).join(' ');
        return data;
    },

    onAddOwnerEntry: function () {
        var self = this;
        var wrapper = $('<div class="add-owner-wrapper"></div>');
        this.$('.add-owner-entry').before(wrapper);
        var node = $('<input type="text" class="form-control" name="owner_uuids[]" placeholder="Search by login, email or uuid" /></div>');
        wrapper = $(wrapper);
        wrapper.html(node);
        var userInput = new TypeaheadUserInput({
            el: $(node),
            showPreview: true
        });
        userInput.render();
        userInput.$el.focus();

        wrapper.append('<a class="remove-owner-entry"><i class="fa fa-minus"></i></a>');
        wrapper.find('.remove-owner-entry').on('click', self.onRemoveOwnerEntry);
    },

    onRemoveOwnerEntry: function (e) {
        $(e.target).parent().parent().remove();
    },

    onSelectedOwner: function () {
        var selectedUserId = this.userInput.selectedUser && this.userInput.selectedUser.id;
        this.fabrics.fetch({params: {owner_uuid: selectedUserId}});
        this.fabrics.on('sync', this.renderVlansDropdown, this);
    },
    renderVlansDropdown: function () {
        var $select = this.$('select[name=vlan_id]');
        $select.empty();
        this.fabrics.each(function (fabric) {
            var name = fabric.get('name');
            var vlan = fabric.get('vlan_id');
            var $option = $('<option />').attr('value', vlan).html(name + '(' + vlan + ')');
            $select.append($option);
        }, this);
    },

    onRender: function () {
        var self = this;

        this.ui.alert.hide();
        this.ui.newNicTagForm.hide();
        
        if (this.nicTags) {
            var $nicTagSelect = this.$('select[name=nic_tag]');
            this.nicTagsSelect.setElement($nicTagSelect);
            this.nicTags.fetch().done(function () {
                $nicTagSelect.val(self.model.get('nic_tag'));
            });
        }

        this.$('[name="owner_uuids[]"]').each(function () {
            var userInput = new TypeaheadUserInput({el: $(this), showPreview: true});
            if (self.options.isFabric) {
                self.userInput = userInput;
                self.userInput.on('selected', self.onSelectedOwner, self);
            }
            userInput.render();
        });
// temp
        this.nicTags.fetch().done(function () {
            var nicTag = self.model.get('nic_tag');
            if (nicTag) {
                $nicTagSelect.val(nicTag);
                $nicTagSelect.attr("disabled", true);
            }
        });
//

        var query = this.options.query;

        if (query && query.vlan_id) {
            var vlanId = query.vlan_id;

            var $vlanIdOption = this.$('select[name=vlan_id] option[value="' + vlanId + '"]');
            if ($vlanIdOption) {
                $vlanIdOption.attr('selected', 'selected');
            }
        }

        this.$('.remove-route:first').hide();
    }
});

module.exports = View;
