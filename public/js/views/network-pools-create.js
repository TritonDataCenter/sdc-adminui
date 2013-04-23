var _ = require('underscore');
var Backbone = require('backbone');

var Networks = require('../models/networks');
var NetworkPool = require('../models/network-pool');
var Template = require('../tpl/network-pools-create.hbs');

var TypeaheadUser = require('../views/typeahead-user');

module.exports = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'network-pools-create',
    attributes: {
        'class': 'modal'
    },
    ui: {
        'ownerInputField': 'input[name=owner_uuid]'
    },
    events: {
        'blur input[name=owner_uuid]': 'onBlurOwnerField',
        'focus input[name=owner_uuid]': 'onFocusOwnerField',
        'submit form': 'onSubmit'
    },
    initialize: function(options) {
        options = options || {};
        this.networks = options.networks || new Networks();
        this.networkPool = options.networkPool || new NetworkPool();
        this.selectedUser = null;
        this.userInput = new TypeaheadUser();
        this.listenTo(this.userInput, 'selected', this.onSelectUser);
        this.listenTo(this.networks, 'sync', this.render);
        this.listenTo(this.networkPool, 'sync', this.onSaved);
    },

    serializeData: function() {
        return {
            networkPool: this.networkPool.toJSON(),
            networks: this.networks.toJSON()
        };
    },


    onFocusOwnerField: function(e) {
        this.selectedUser = null;
        this.userInput.val('');
    },
    onBlurOwnerField: function(e) {
        /*
         * prevent the user from de-focusing on the field if the user never selected
         * a user from the dropdown
         */
        var $field = $(e.target);
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

    onSelectUser: function(user) {
        this.selectedUser = user;
    },

    onSubmit: function(e) {
        e.preventDefault();
        var data = this.$('form').serializeObject();
        this.networkPool.set(data);
        this.networkPool.save();
    },

    onSaved: function() {
        this.trigger('saved', this.networkPool);
    },

    onRender: function() {
        this.userInput.setElement(this.$('input[name=owner_uuid]'));
        this.$('select').chosen();
    },

    show: function() {
        this.render();
        this.$el.modal();
        this.$('input:first').focus();
    }
});
