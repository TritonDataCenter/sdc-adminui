var _ = require('underscore');
var Backbone = require('backbone');

var Networks = require('../models/networks');
var NetworkPool = require('../models/network-pool');
var Template = require('../tpl/network-pools-create.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
    template: Template,
    id: 'network-pools-create',
    attributes: {
        'class': 'modal'
    },
    events: {
        'submit form': 'onSubmit'
    },
    initialize: function(options) {
        options = options || {};
        this.networks = options.networks || new Networks();
        this.networkPool = options.networkPool || new NetworkPool();

        this.listenTo(this.networks, 'sync', this.render);
        this.listenTo(this.networkPool, 'sync', this.onSaved);
    },

    serializeData: function() {
        return {
            networkPool: this.networkPool.toJSON(),
            networks: this.networks.toJSON()
        };
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
        var self = this;
        process.nextTick(function() {
            self.$('select').chosen();
        });
    },
    show: function() {
        this.render();
        this.$el.modal();
    }
});
