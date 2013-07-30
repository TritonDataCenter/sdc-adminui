var Backbone = require('backbone');
var app = require('adminui');
var ServerBootOptionsView = require('./server-boot-options');

var SlidingPanelRegionType = Backbone.Marionette.Region.extend({
    open: function(view) {
        this.$el.hide();
        this.$el.html(view.el);
        this.$el.slideDown("fast")
    },
    close: function() {
        var view = this.currentView;
        var self = this;
        if (!view || view.isClosed){ return; }

        var close = Backbone.Marionette.Region.prototype.close;
        this.currentView.$el.slideUp('fast', function() {
            close.apply(self);
        });
    }
});

var adminui = require('../adminui');
var Servers = require('../models/servers');

var ServersList = require('./servers-list');


var FilterForm = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/servers-filter.hbs'),
    events: {
        'submit form': 'onSubmit',
        'keyup input': 'onSubmit',
        'change select': 'onSubmit'
    },
    onSubmit: function(e) {
        e.preventDefault();
        var params = Backbone.Syphon.serialize(this);
        this.trigger('query', params);
    }
});

var ServersView = Backbone.Marionette.Layout.extend({
    name: 'servers',
    id: 'page-servers',
    template: require('../tpl/servers.hbs'),
    events: {
        'click .toggle-boot-options':'toggleBootOptions'
    },
    url: function() {
        return 'servers';
    },
    regions: {
        'bootOptionsRegion': {
            selector: '.default-boot-options-region',
            regionType: SlidingPanelRegionType
        },
        'listRegion': '.servers-list-region',
        'filterRegion': '.servers-filter-region'
    },
    initialize: function() {
        this.serversList = new ServersList();

        this.listenTo(this.serversList.collection, 'error', this.onError, this);
        this.listenTo(this.serversList.collection, 'request', this.onRequest, this);
        this.listenTo(this.serversList.collection, 'sync', this.onSync, this);

        this.filterForm = new FilterForm();
        this.listenTo(this.filterForm, 'query', this.serversList.filter);
    },

    onRequest: function() {
        this.$('.record-summary').hide();
    },

    onSync: function() {
        if (this.serversList.collection.length) {
            this.$('.record-count').html(this.serversList.collection.length);
            this.$('.record-summary').show();
        } else {
            this.$('.record-summary').hide();
        }
    },

    onShow: function() {
        this.listRegion.show(this.serversList);
        this.filterRegion.show(this.filterForm);
    },

    toggleBootOptions: function() {
        var bootOptionsButton = this.$('.toggle-boot-options');
        var bootOptionsRegion = this.bootOptionsRegion;

        function close() {
            bootOptionsRegion.close();
            bootOptionsButton.removeClass('disabled');
        }

        function saved() {
            app.vent.trigger('notification', {
                level: 'success',
                message: 'Default Boot Options updated'
            });
            close();
        }

        if (this.bootOptionsRegion.currentView) {
            close();
        } else {
            bootOptionsButton.addClass('disabled');

            var bootOptions = new Backbone.Model();
            bootOptions.url = '/_/boot/default';
            var bootOptionsView = new ServerBootOptionsView({ model: bootOptions });
            bootOptionsView.on('saved', saved);
            bootOptionsView.on('cancel', close);

            bootOptions.fetch().done(function() {
                bootOptionsRegion.show(bootOptionsView);
            });
        }
    }
});

module.exports = ServersView;

