/**
 * ./vms.js
 */
var app = require('../adminui');
var _ = require('underscore');
var Backbone = require('backbone');

var Vms = require('../models/vms');
var VmsList = require('./vms-list');
var VmsTemplate = require('../tpl/vms.hbs');
var UserInput = require('./typeahead-user');

var FilterForm = Backbone.Marionette.ItemView.extend({
    events: {
        'submit form.quick': 'onQuick',
        'submit form.more': 'detailedSearch',
        'change form.more select[name=state]': 'detailedSearch',
        'change form.more select[name=alias]': 'detailedSearch',
        'change form.more select[name=server_uuid]': 'detailedSearch',
        'click .toggle-filter': 'toggleFiltersPanel'
    },
    initialize: function() {
        this.params = {};
    },
    template: require('../tpl/vms-filter.hbs'),
    onRender: function() {
        this.userInput = new UserInput({el: this.$('input[name=owner_uuid]')});
        this.userInput.render();
        this.$('.more').hide();
    },
    onQuick: function(e) {
        e.preventDefault();

        var obj = this.$('form.quick').serializeObject();
        var params = {};
        params[obj.property] = obj.value;
        this.trigger('query', params);
    },
    detailedSearch: function(e) {
        e.preventDefault();

        var params = this.$('form.more').serializeObject();
        this.trigger('query', params);
    },
    toggleFiltersPanel: function(e) {
        var filterPanel = this.$('.more');
        var filterPanelVisible = (filterPanel.is(':visible'));
        this.$('form.quick .btn-info').prop('disabled', !filterPanelVisible);
        this.$('form.quick select').prop('disabled', !filterPanelVisible);
        this.$('form.quick input').prop('disabled', !filterPanelVisible);
        if (filterPanelVisible) {
            filterPanel.hide();
        } else {
            filterPanel.show();
        }
    }
});



module.exports = Backbone.Marionette.ItemView.extend({
    name: 'vms',
    id: 'page-vms',
    template: VmsTemplate,

    url: function() {
        return 'vms';
    },

    ui: {
        'alert': '.alert'
    },

    events: {
        'click .provision-button':'provision',
        'click .toggle-filter':'toggleFiltersPanel'
    },

    initialize: function(options) {
        this.filterView = new FilterForm();
        this.collection = new Vms();
        this.listView = new VmsList({ collection: this.collection });

        this.listenTo(this.filterView, 'query', this.query, this);
        this.listenTo(this.collection, 'error', this.onError, this);
        this.listenTo(this.collection, 'request', this.hideSummary, this);
        this.listenTo(this.collection, 'sync', this.updateCount, this.listView.render, this);
    },

    provision: function() {
        app.vent.trigger('showview', 'provision', {});
    },


    query: function(params) {
        this.ui.alert.hide();
        this.collection.params = params;
        this.collection.firstPage();
        this.collection.fetch();
    },


    onScroll: function(e) {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
            this.next();
        }
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    },

    onError: function(model, res) {
        if (res.status === 409 || res.status === 422) {
            var obj = JSON.parse(res.responseText);
            var errors = _.map(obj.errors, function(e) {
                return e.message;
            });
            app.vent.trigger('notification', {
                level: 'error',
                message: errors.join(' ')
            });
        } else {
            app.vent.trigger('error', {
                xhr: res,
                context: 'vms / vmapi'
            });
        }
    },

    onShow: function() {
        this.$('.alert').hide();

        $(window).on('scroll', this.onScroll.bind(this));
    },

    hideSummary: function() {
        this.$('.vms-list caption').hide();
    },

    updateCount: function() {
        this.$('.record-count').html(this.collection.objectCount);
        this.$('.current-count').html(this.collection.length);
        this.$('.vms-list caption').show();
    },

    onRender: function() {
        this.listView.setElement(this.$('tbody')).render();
        this.filterView.setElement(this.$('.vms-filter'));
        this.filterView.render();

        this.query({state: 'running'});

        return this;
    },

    onBeforeClose: function() {
        $(window).off('scroll', this.onSroll);
    }
});
