var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');
var ServerSetup = require('./server-setup');
var Raphael = require('raphael');


/**
* ./servers.js
*/


var adminui = require('../adminui');
var Servers = require('../models/servers');
var tplServers = require('../tpl/servers.hbs');

var ServersListItem = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/servers-list-item.hbs'),
    attributes: {
        'class': 'servers-list-item'
    },
    events: {
        'click .name a':'navigateToServerDetails',
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
        var data = _.clone(this.model.toJSON());
        _.extend(data, {
            running: data.status === 'running',
            not_setup: data.setup === false,
            last_boot: moment(data.last_boot).fromNow(),
            last_heartbeat: moment(data.last_heartbeat).fromNow(),
            memory_available_mb: _.str.sprintf("%0.1f", data.memory_available_bytes/1024/1024),
            memory_total_mb: _.str.sprintf("%0.1f", data.memory_total_bytes/1024/1024),
            memory_available_gb: _.str.sprintf("%0.1f", data.memory_available_bytes/1024/1024/1024),
            memory_total_gb: _.str.sprintf("%0.1f", data.memory_total_bytes/1024/1024/1024)
        });
        data.memory_used_percent = (data.memory_available_mb / data.memory_total_mb);
        console.log(data);
        return data;
    },

    onRender: function() {
        this.$(".last-platform").tooltip({
            title: _.str.sprintf('Platform Version', this.model.get('current_platform')),
            placement: 'top',
            container: 'body'
        });

        this.$(".last-boot").tooltip({
            title: _.str.sprintf('Last boot at %s',
                moment(this.model.get('last_boot')).utc().format('LLL')),
            placement: 'top',
            container: 'body'
        });

        this.$(".last-heartbeat").tooltip({
            title: _.str.sprintf('Last heartbeat at %s',
                moment(this.model.get('last_heartbeat')).utc().format('LLL')),
            placement: 'bottom',
            container: 'body'
        });

        if (this.model.get('setup')) {
            process.nextTick(this.drawMemoryGraph.bind(this));
        }
    },
    drawMemoryGraph: function() {
        var $node = this.$('.memory-usage-graph');
        var avail = this.model.get('memory_available_bytes');
        var total = this.model.get('memory_total_bytes');
        var used = total - avail;
        var w = $node.width();
        var h = 4;
        var paper = new Raphael($node.get(0), w, h);

        var uw = w * (used/total);
        var ug = paper.rect(0, 0, 0, h);
        ug.attr({ 'fill': "#ccc", 'stroke-width': 0 });

        var fw = w * (avail/total);
        var fg = paper.rect(uw, 0, 0, h);
        fg.attr({ 'fill': "#00d295", 'stroke-width': 0 });
        var uga = Raphael.animation({width: uw}, 300, 'linear');
        var fga = Raphael.animation({width: fw}, 300, '>');

        ug.animate(uga.delay(100));
        fg.animate(fga.delay(400));
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

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },
    itemViewContainer: '.servers-list-region',
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

        this.listenTo(this.collection, 'request', this.onRequest, this);
        this.listenTo(this.collection, 'sync', this.onSync, this);
    },

    onRequest: function() {
        this.ui.serversList.find('.record-summary').hide();
    },

    onSync: function() {
        this.ui.serversList.find('.record-count').html(this.collection.length);
        this.ui.serversList.find('.record-summary').show();
    },

    filter: function(params) {
        this.collection.fetch({params: params});
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

