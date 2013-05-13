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

var FilterForm = Backbone.View.extend({
    events: {
        'submit form': 'onSubmit',
        'change input': 'onSubmit',
        'change select': 'onSubmit'
    },
    render: function() {
        console.log('render');
        this.userInput = new UserInput({el: this.$('input[name=owner_uuid]')});
        this.userInput.render();
    },
    onSubmit: function(e) {
        e.preventDefault();

        var params = this.$('form').serializeObject();
        this.trigger('query', params);
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
        this.filterViewVisible = false;
        this.filterView = new FilterForm();
        this.collection = new Vms();
        this.listView = new VmsList({ collection: this.collection });

        this.listenTo(this.filterView, 'query', this.query, this);
        this.listenTo(this.collection, 'error', this.onError, this);
        this.listenTo(this.collection, 'request', this.hideSummary, this);
        this.listenTo(this.collection, 'sync', this.updateCount, this);
        this.listenTo(this.collection, 'sync', this.listView.render, this);
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
            this.ui.alert.html(errors.join('<br>')).show();
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
