var adminui = require('adminui');
var Backbone = require('backbone');
var Networks = require('../models/networks');
var NetworksListView = require('./networks-list');

module.exports = Backbone.Marionette.Layout.extend({
    template: require('../tpl/nictag.hbs'),
    attributes: {
        'id': 'page-nictag'
    },
    regions: {
        "networksRegion": '.networks-region'
    },
    initialize: function() {
        this.collection = new Networks(null, {nic_tag: this.model.get('name')});
        this.networksView = new NetworksListView({ collection: this.collection });
        this.listenTo(this.networksView, 'select', this.showNetwork, this);
    },
    showNetwork: function(network) {
        adminui.vent.trigger('showview', 'network', {model: network});
    },
    onRender: function() {
    },
    onShow: function() {
        this.collection.fetch().done(function() {
            this.networksRegion.show(this.networksView);
        }.bind(this));
    }


});
