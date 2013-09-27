var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('adminui');


var Networks = require('../models/networks');
var Network = require('../models/network');

var User = require('../models/user');

var NetworksList = require('../views/networks-list');
var NetworkPools = require('../models/network-pools');
var NetworkPoolsList = require('../views/network-pools-list');

var TraitsEditor = require('./traits-editor');



var PackagesDetailTemplate = require('../tpl/packages-detail-template.hbs');

var Handlebars = require('handlebars-runtime');
Handlebars.registerHelper('normalize', function(v) {
    v = Number(v);
    if (v % 1024 === 0) {
        return _.str.sprintf("%d GB", v / 1024);
    }

    return _.str.sprintf("%d MB", v);
});




var PackageDetail = module.exports = Backbone.Marionette.ItemView.extend({
    template: PackagesDetailTemplate,
    attributes: {
        id: 'page-package'
    },
    sidebar: 'packages',
    url: function() {
        return ('packages/' + this.model.get('uuid'));
    },
    events: {
        'click .edit': 'onEdit',
        'click .traits': 'onTraits',
        'click .login': 'navigateToUser'
    },

    initialize: function(options) {
        this.nets = _.map(this.model.get('networks') || [], function(uuid) {
            return {uuid: uuid};
        });

        this.networks = new Networks(this.nets);
        this.networksView = new NetworksList({ collection: this.networks });

        this.listenTo(this.networksView, 'select', this.onSelectNetwork);
    },

    serializeData: function() {
        var data = _.clone(this.model.toJSON());
        var owner_uuid = this.model.get('owner_uuid');

        if (typeof(owner_uuid) === 'string') {
            data.owner_uuid = [owner_uuid];
        }

        return data;
    },

    navigateToUser: function(e) {
        e.preventDefault();
        adminui.vent.trigger('showview', 'user', {uuid: $(e.target).attr('data-uuid')});
    },

    onEdit: function() {
        adminui.vent.trigger('showview', 'packages-form', {model: this.model });
    },

    onSelectNetwork: function(model) {
        adminui.vent.trigger('showview', 'network', {model: this.model });
    },

    onSaveTraits: function(traits) {
        var that = this;
        this.model.save(
            { traits: traits },
            { patch: true }
        ).done(function() {
            adminui.vent.trigger('notification', {
                level: 'success',
                message: 'Package traits saved successfully.'
            });
            that.traitsEditor.close();
        });
    },

    onTraits: function() {
        this.traitsEditor = new TraitsEditor({
            data: this.model.get('traits'),
            title: _.str.sprintf('Trats for package: %s', this.model.get('name'))
        });
        this.listenTo(this.traitsEditor, 'save', this.onSaveTraits, this);
        this.traitsEditor.show();
    },

    renderNetworks: function() {
        this.$('.networks-list').html(this.networksView.el);
        this.networksView.render();
        var networksView = this.networksView;
        var networks = this.networks;

        networks.each(function(n) {
            n.fetch().done(function() {
                networksView.children.findByModel(n).render();
            }).fail(function() {
                networksView.children.findByModel(n).remove();
            });
        });
    },

    renderNetworkPools: function() {
        var networks = new Networks();
        networks.fetch().done(done.bind(this));

        function done() {
            this.networkPools = new NetworkPools(this.nets);

            var networkPools = this.networkPools;
            var size = networkPools.length;
            var n = 0;
            var self = this;

            networkPools.each(function(n) {
                n.fetch().done(function() {
                    ok();
                }).fail(function() {
                    networkPools.remove(n);
                    ok();
                });
            });

            function ok() {
                n++;
                if (n === size) {
                    self.networkPoolsView = new NetworkPoolsList({
                        networks: networks,
                        collection: networkPools
                    });
                    self.$('.network-pools-list').html(self.networkPoolsView.el);
                    self.networkPoolsView.render();
                }
            }

        }
    },

    onRender: function() {
        if (0 === this.networks.length) {
            this.$('.networks').hide();
        }

        this.renderNetworks();
        this.renderNetworkPools();

        this.$('.owner .login').each(function(i, elm) {
            var user = new User({uuid: $(elm).attr('data-uuid')});
            user.fetch().done(function(u) {
                console.log(user);
                $(elm).html(user.get('login'));
            });
        });
    }

});
