var moment = require('moment');
var Raphael = require('raphael');
var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../adminui');

var Servers = require('../models/servers');
var ServerSetup = require('./server-setup');

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
            memory_provisionable_mb: _.str.sprintf("%0.1f", data.memory_provisionable_bytes/1024/1024),
            memory_total_mb: _.str.sprintf("%0.1f", data.memory_total_bytes/1024/1024),
            memory_available_gb: _.str.sprintf("%0.1f", data.memory_available_bytes/1024/1024/1024),
            memory_provisionable_gb: _.str.sprintf("%0.1f", data.memory_provisionable_bytes/1024/1024/1024),
            memory_total_gb: _.str.sprintf("%0.1f", data.memory_total_bytes/1024/1024/1024),
        });
        if (Number(data.memory_provisionable_mb) < 0) {
            data.memory_provisionable_mb = "0";
            data.memory_provisionable_gb = "0";
        }
        data.memory_provisionable_percent = (Number(data.memory_provisionable_mb) / Number(data.memory_total_mb));
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
        var avail = this.model.get('memory_provisionable_bytes');
        if (avail < 0) {
            avail = 0;
        }
        var total = this.model.get('memory_total_bytes');
        var used = total - avail;
        if (used < 0) {
            used = 0;
        }

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

var ServersList = module.exports = require('./collection').extend({
    emptyView: require('./empty'),
    itemView: ServersListItem,
    attributes: {
        'class': 'servers-list'
    },

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    initialize: function(options) {
        _.bindAll(this, 'query');
        this.collection = this.collection || new Servers();
        options = options || {};
        if (options.params) {
            this.collection.params = options.params;
        }
    },


    query: function(params) {
        this.collection.fetch({params: params}, {reset: true});
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            context: 'servers / cnapi',
            xhr: xhr
        });
    },

    onShow: function() {
        this.collection.fetch();
    }
});


