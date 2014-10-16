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

var Template = require('../tpl/networks-create.hbs');
var Network = require('../models/network');
var NicTags = require('../models/nictags');

var TypeaheadUserInput = require('./typeahead-user');

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
        'click .remove-route': 'onRemoveRoute'
    },

    ui: {
        'alert': '.alert',
        'nicTagSelect': 'select[name=nic_tag]',
        'newNicTagForm': '.nic-tag-form',
        'createNewNicTagButton': '.create-new-nic-tag'
    },

    modelEvents: {
        'sync': 'onSaved',
        'error': 'onError'
    },

    initialize: function() {
        if (!this.model) {
            this.model = new Network();
        }
        this.nicTags = new NicTags();
        this.nicTagsSelect = new Backbone.Marionette.CollectionView({
            itemView: NicTagSelectItem,
            collection: this.nicTags
        });
    },

    onClickCreateNewNicTag: function() {
        var self = this;
        this.ui.nicTagSelect.hide();
        this.ui.createNewNicTagButton.hide();

        var createNicTagView = new CreateNicTagView();
        this.createNicTagRegion.show(createNicTagView);
        createNicTagView.on('save', function(tag) {
            self.nicTags.fetch().done(function() {
                self.ui.nicTagSelect.val(tag.get('name'));
                self.ui.nicTagSelect.show();
                self.ui.createNewNicTagButton.show();
            });
        });
        createNicTagView.on('close', function() {
            self.ui.nicTagSelect.show();
            self.ui.createNewNicTagButton.show();
        });
    },

    onSaved: function() {
        this.trigger('saved', this.model);
    },

    onSubmit: function(e) {
        e.preventDefault();

        var data = Backbone.Syphon.serialize(this);
        data.owner_uuids = _.compact(data.owner_uuids);
        data.resolvers = data.resolvers.split(" ");

        var routes = {};
        _.each(data.routes, function(data, i) {
            if (data.subnet.length && data.gateway.length) {
                routes[data.subnet] = data.gateway;
            }
        });
        data.routes = routes;
        data.nic_tag = this.$('select[name=nic_tag]').val();
        this.model.set(data);
        console.log('save data:', data);
        this.model.save();
    },

    onError: function(model, xhr, options) {
        var fieldMap = {
            'name': '[name=name]',
            'subnet': '[name=subnet]',
            'gateway': '[name=gateway]',
            'provision_start_ip': '[name=provision_start_ip]',
            'provision_end_ip': '[name=provision_end_ip]',
            'resolvers': '[name=resolvers]',
            'owner_uuids': '[name="owner_uuids[]"]',
            'nic_tag': 'input[name=nic_tag]',
            'vlan_id': '[name=vlan_id]'
        };
        var err = xhr.responseData;
        console.log('network creation validation failed', err);
        this.$('.form-groupo').removeClass('error');
        this.$('.help-block', 'form-group').remove();

        _.each(err.errors, function(errObj) {
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

    onAddRoute: function() {
        var l = $('.routes-controls').length.toString();

        var controls = $('.routes-controls:last').clone();
        $('input:first', controls).attr('name', 'routes['+l+'][subnet]').val('');
        $('input:last', controls).attr('name', 'routes['+l+'][gateway]').val('');
        $('.routes-controls:last').after(controls);
        $('.remove-route', controls).show();
    },

    onRemoveRoute: function(e) {
        $(e.currentTarget).parent('.routes-controls').remove();
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        if (data.uuid) {
            data.inUse = this.options.inUse || false;
        } else {
            data.inUse = false;
        }
        var routes = data.routes;
        data.routes = [];
        if (data.owner_uuids) {
            data.owner_uuid = data.owner_uuids[0];
        }
        for (var subnet in routes) {
            data.routes.push({subnet: subnet, gateway: routes[subnet]});
        }
        data.resolvers = (this.model.get('resolvers') || []).join(' ');

        return data;
    },


    onRender: function() {
        var self = this;

        this.ui.newNicTagForm.hide();

        this.nicTagsSelect.setElement(this.$('select[name=nic_tag]'));

        this.userInput = new TypeaheadUserInput({el: this.$('[name="owner_uuids[]"]') });
        this.userInput.render();
        this.nicTags.fetch().done(function() {
            self.$('select[name=nic_tag]').val(self.model.get('nic_tag'));
        });
        this.$('.remove-route:first').hide();
    },

    show: function() {
        this.render();
        this.$('.alert-danger').hide();
        this.$el.modal('show');
    }

});

module.exports = View;
