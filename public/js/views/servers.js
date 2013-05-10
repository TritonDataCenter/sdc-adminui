var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');
var ServerSetup = require('./server-setup');


/**
* ./servers.js
*/


var adminui = require('../adminui');
var Servers = require('../models/servers');
var tplServers = require('../tpl/servers.hbs');

var ServersListItem = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/servers-list-item.hbs'),
    tagName: 'tr',

    events: {
        'click td.name a':'navigateToServerDetails',
        'click .setup':'setup'
    },

    url: function() {
        return 'servers';
    },

    navigateToServerDetails: function(e) {
        if (e.metaKey) {
            return true;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', { server:this.model });
    },

    setup: function() {
        var view = new ServerSetup({ model: this.model });
        view.render();
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        _.extend(data, {
            running: data.status === 'running',
            not_setup: data.setup === false,
            last_boot: moment(data.last_boot).fromNow(),
            last_heartbeat: moment(data.last_heartbeat).fromNow(),
            memory_available_mb: _.str.sprintf("%0.1f", this.memory_available_bytes/1024/1024),
            memory_total_mb: _.str.sprintf("%0.1f", this.memory_total_bytes/1024/1024)
        });
        return data;
    },

    onRender: function() {
        this.$(".last-boot").tooltip({
            title: _.str.sprintf('Last boot at %s',
                moment(this.model.get('last_boot')).format('LLL')),
            placement: 'top',
            container: 'body'
        });
        this.$(".last-heartbeat").tooltip({
            title: _.str.sprintf('Last heartbeat at %s',
                moment(this.model.get('last_heartbeat')).format('LLL')),
            placement: 'bottom',
            container: 'body'
        });
    }
});

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

var ServersView = require('./composite').extend({
    name: 'servers',
    id: 'page-servers',
    template: tplServers,
    emptyView: require('./empty').extend({
        columns: 5
    }),
    itemView: ServersListItem,
    itemViewContainer: 'tbody',
    events: {
        'click .toggle-filter':'toggleFiltersPanel'
    },
    ui: {
        'filterPanel': '.filter-panel',
        'serversList': '.servers-list'
    },

    url: function() {
        return 'servers';
    },

    initialize: function(options) {
        this.filterForm = new FilterForm();
        this.collection = new Servers();

        this.listenTo(this.filterForm, 'query', this.filter, this);
        this.listenTo(this.collection, 'error', this.onError, this);
        this.listenTo(this.collection, 'sync', this.onSync, this);
        this.listenTo(this.collection, 'request', this.onRequest, this);
    },

    onRequest: function() {
        this.ui.serversList.find('caption').hide();
    },

    onSync: function() {
        this.ui.serversList.find('.record-count').html(this.collection.length);
        this.ui.serversList.find('caption').show();
    },

    filter: function(params) {
        this.collection.fetch({data: params});
    },

    toggleFiltersPanel: function(e) {
        if (this.filterViewVisible) {
            this.ui.filterPanel.hide();
            this.ui.serversList.removeClass('span9').addClass('span12');
            this.filterViewVisible = false;
        } else {
            this.ui.filterPanel.show();
            this.ui.serversList.addClass('span9').removeClass('span12');
            this.filterViewVisible = true;
        }
    },
    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            context: 'servers / cnapi',
            xhr: xhr
        });
    },
    onRender: function() {
        this.filterForm.setElement(this.$('.servers-filter'));
        this.ui.filterPanel.hide();
        this.collection.fetch();
    }
});

module.exports = ServersView;

