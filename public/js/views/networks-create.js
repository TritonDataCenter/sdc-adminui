var Backbone = require('backbone');
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
        'click .create-new-nic-tag': 'onClickCreateNewNicTag'
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
        this.modelBinder = new Backbone.ModelBinder();
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



    onRender: function() {
        this.ui.newNicTagField.hide();
        this.nicTagsSelect.setElement(this.$('select[name=nic_tag]'));
        this.userInput = new TypeaheadUserInput({el: this.$('[name=owner_uuid]') });
        this.nicTags.fetch();
        var bindings = Backbone.ModelBinder.createDefaultBindings(this.el, 'name');
        bindings['resolvers'].converter = function(direction, value, attrName, model) {
            if (direction === 'ModelToView') {
                return (value || []).join(',');
            } else {
                return value.split(',');
            }
        };
        this.modelBinder.bind(this.model, this.el, bindings);
    },

    show: function() {
        this.render();
        this.$('.alert').hide();
        this.$el.modal('show');
    },

    onClose: function() {
        this.modelBinder.unbind();
    }
});

module.exports = View;
