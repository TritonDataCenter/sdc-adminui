/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');

require('backbone.syphon');

var _ = require('underscore');
var $ = require('jquery');
var adminui = require('../adminui');

var Template = require('../tpl/networks-create.hbs');
var Network = require('../models/network');
var NicTags = require('../models/nictags');
var TypeaheadUserInput = require('./typeahead-user');
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
    attributes: {
        'class': 'modal'
    },

    id: 'network-create-modal',

    events: {
        'submit form': 'onSubmit',
        'click .save': 'onSubmit',
        'click .create-new-nic-tag': 'onClickCreateNewNicTag',
        'click .add-route': 'onAddRoute',
        'click .remove-route': 'onRemoveRoute',
        'click a.add-owner-entry': 'onAddOwnerEntry',
        'change .fabric-network': 'onChangeFabric'
    },

    ui: {
        'alert': '.alert',
        'nicTagSelect': 'select[name=nic_tag]',
        'newNicTagForm': '.nic-tag-form',
        'createNewNicTagButton': '.create-new-nic-tag'
    },

    initialize: function () {
        if (!this.model) {
            this.model = new Network();
        }
        this.nicTags = new NicTags();
        this.nicTagsSelect = new Backbone.Marionette.CollectionView({
            itemView: NicTagSelectItem,
            collection: this.nicTags
        });
    },

    onChangeFabric: function (e) {
        $('.network-mtu').prop('readonly', e.target.checked).val('');
        $('select[name=nic_tag]').prop('disabled', e.target.checked).val('');
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
        this.trigger('saved', this.model);
        this.$el.modal('hide').remove();
        adminui.vent.trigger('notification', {
            level: 'success',
            message: _.str.sprintf('Network <strong>%s</strong> created successfully.', this.model.get('name'))
        });
    },

    onSubmit: function (e) {
        e.preventDefault();
        var self = this;
        var data = Backbone.Syphon.serialize(this);
        data.owner_uuids = _.compact(data.owner_uuids);
        data.resolvers = data.resolvers.split(" ");

        var routes = {};
        _.each(data.routes, function(data, i) {
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
            data.owner_uuids = [vlan.owner_uuid];
            data.vlan_id = vlan.vlan_id;
            if (data['fabric-network']) {
                data = _.extend(data, {
                    fabric: true,
                    owner_uuid: vlan.owner_uuid
                });
            } else {
                this.model = new Network();
            }
        }

        this.model.set(data);
        this.model.save().done(self.onSaved.bind(self)).fail(self.onError.bind(self));
    },

    onError: function (xhr) {
        var fieldMap = {
            name: '[name=name]',
            subnet: '[name=subnet]',
            gateway: '[name=gateway]',
            provision_start_ip: '[name=provision_start_ip]',
            provision_end_ip: '[name=provision_end_ip]',
            resolvers: '[name=resolvers]',
            owner_uuids: '[name="owner_uuids[]"]',
            nic_tag: 'input[name=nic_tag]',
            vlan_id: '[name=vlan_id]',
            mtu: 'input[name=mtu]'
        };
        var err = xhr.responseData;
        $('.form-groupo').removeClass('error');
        $('.help-block', 'form-group').remove();

        _.each(err.errors, function (errObj) {
            var $field = $(fieldMap[errObj.field]);
            var $controlGroup = $field.parents('.form-group');
            $controlGroup.addClass('has-error');
            if (errObj.message) {
                var errmsg = $("<div class='help-block text-danger'>").html(errObj.message);
                $field.after(errmsg);
            }
        }, this);

        this.ui.alert.find('.error').html(err.message);
        this.ui.alert.show();
    },

    onAddRoute: function () {
        var l = $('.routes-controls').length.toString();
        var controls = $('.routes-controls:last').clone();
        $('input:first', controls).attr('name', 'routes['+l+'][subnet]').val('');
        $('input:last', controls).attr('name', 'routes['+l+'][gateway]').val('');
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
            data.isFabric = true;
            data.owner_uuid = this.options.data.owner_uuid;
            data.vlan_id = this.options.data.vlan_id;
            data.internet_nat = data.hasOwnProperty('internet_nat') ? data.internet_nat : true;
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

    onRender: function () {
        var self = this;

        this.ui.newNicTagForm.hide();

        this.nicTagsSelect.setElement(this.$('select[name=nic_tag]'));

        this.$('[name="owner_uuids[]"]').each(function () {
            var userInput = new TypeaheadUserInput({el: $(this), showPreview: true});
            userInput.render();
        });
        this.nicTags.fetch().done(function () {
            self.$('select[name=nic_tag]').val(self.model.get('nic_tag'));
        });
        this.$('.remove-route:first').hide();
    },

    show: function () {
        this.render();
        this.$('.alert-danger').hide();
        this.$el.modal('show');
    }

});

module.exports = View;
