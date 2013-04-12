

/**
 * ./vms.js
 */
var app = require('../adminui');
var Backbone = require('backbone');

var Vms = require('../models/vms');
var VmsList = require('./vms-list');
var VmsTemplate = require('../tpl/vms.hbs');

var FilterForm = Backbone.View.extend({
    events: {
        'submit form': 'onSubmit',
        'change input': 'onSubmit',
        'change select': 'onSubmit'
    },
    onSubmit: function(e) {
        e.preventDefault();

        var params = this.$('form').serializeObject();
        this.trigger('query', params);
    }
});

module.exports = Backbone.Marionette.ItemView.extend({
    name: 'vms',
    template: VmsTemplate,

    url: function() {
        return 'vms';
    },

    events: {
        'click .provision-button':'provision',
        'click .toggle-filter':'toggleFiltersPanel'
    },

    initialize: function(options) {
        this.collection = new Vms();
        this.listView = new VmsList({ collection: this.collection });
        this.filterView = new FilterForm();
        this.filterViewVisible = false;
        this.collection.fetch();
    },

    provision: function() {
        app.vent.trigger('showview', 'provision-vm', {});
    },


    toggleFiltersPanel: function(e) {
        var filterPanel = this.$('.vms-filter');
        var vmsList = this.$('.vms-list');
        if (this.filterViewVisible) {
            filterPanel.hide();
            vmsList.removeClass('span9').addClass('span12');
            this.filterViewVisible = false;
        } else {
            filterPanel.show();
            vmsList.addClass('span9').removeClass('span12');
            this.filterViewVisible = true;
        }
    },

    query: function(params) {
        this.$('.alert').hide();
        this.collection.fetch({ data: params });
    },

    onError: function(model, res) {
        if (res.status == 409) {
            var obj = JSON.parse(res.responseText);
            var errors = _.map(obj.errors, function(e) {
                return e.message;
            });
            this.$(".alert").html(errors.join('<br>')).show();
        } else {
            app.vent.trigger('error', {
                xhr: res,
                context: 'vms / vmapi'
            });
        }
    },

    onShow: function() {
        this.$('.alert').hide();
        this.$('.vms-filter').hide();
    },

    updateCount: function() {
        this.$('.record-count').html(this.collection.length);
    },

    onRender: function() {
        this.listenTo(this.collection, 'error', this.onError, this);
        this.listView.setElement(this.$('tbody')).render();
        this.filterView.setElement(this.$('.vms-filter'));

        this.listenTo(this.filterView, 'query', this.query, this);
        this.listenTo(this.collection, 'reset', this.updateCount, this);
        return this;
    }
});
