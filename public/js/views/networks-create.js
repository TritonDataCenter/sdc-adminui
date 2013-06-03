var Backbone = require('backbone');
require('backbone.syphon');
var _ = require('underscore');

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

var View = Backbone.Marionette.ItemView.extend({
    template: Template,
    attributes: {
        'class': 'modal'
    },

    id: 'network-create-modal',

    events: {
        'submit form': 'onSubmit',
        'click .save': 'onSubmit',
        'click .create-new-nic-tag': 'onClickCreateNewNicTag',
        'click .add-route': 'onAddRoute'
    },

    ui: {
        'alert': '.alert',
        'nicTagSelect': 'select[name=nic_tag]',
        'newNicTagField': 'input[name=nic_tag]',
        'createNewNicTagButton': '.create-new-nic-tag'
    },

    modelEvents: {
        'sync': 'onSaved',
        'error': 'onError'
    },

    initialize: function() {
        this.model = new Network();
        this.nicTags = new NicTags();
        this.nicTagsSelect = new Backbone.Marionette.CollectionView({
            itemView: NicTagSelectItem,
            collection: this.nicTags
        });
    },

    onClickCreateNewNicTag: function() {
        this.ui.nicTagSelect.hide();
        this.ui.createNewNicTagButton.hide();
        this.ui.newNicTagField.show().focus();
    },

    onSaved: function() {
        this.trigger('saved', this.model);
    },

    onSubmit: function(e) {
        e.preventDefault();
        var data = Backbone.Syphon.serialize(this);
        data.resolvers = data.resolvers.split(" ");
        var routes = {};
        _.each(data.routes, function(data, i) {
            routes[data.subnet] = data.gateway;
        });
        data.routes = routes;
        data.nic_tag = this.$('select[name=nic_tag]').val();
        console.log(data);
        this.model.set(data);
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
            'owner_uuid': '[name=owner_uuid]',
            'nic_tag': 'input[name=nic_tag]',
            'vlan_id': '[name=vlan_id]'
        };
        var err = xhr.responseData;
        console.log('network creation validation failed', err);
        this.$('.control-group').removeClass('error');
        this.$('.help-inline', 'control-group').remove();
        _.each(err.errors, function(errObj) {
            var $field = $(fieldMap[errObj.field]);
            var $controlGroup = $field.parents('.control-group');
            $controlGroup.addClass('error');
            if (errObj.message) {
                var errmsg = $("<div class='help-inline'>").html(errObj.message);
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
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        data.resolvers = (this.model.get('resolvers') || []).join(' ');

        return data;
    },


    onRender: function() {
        this.ui.newNicTagField.hide();
        this.nicTagsSelect.setElement(this.$('select[name=nic_tag]'));
        this.userInput = new TypeaheadUserInput({el: this.$('[name=owner_uuid]') });
        this.userInput.render();
        this.nicTags.fetch();
    },

    show: function() {
        this.render();
        this.$('.alert').hide();
        this.$el.modal('show');
    }

});

module.exports = View;
