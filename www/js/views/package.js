/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('adminui');
var $ = require('jquery');

var Packages = require('../models/packages');
var Networks = require('../models/networks');

var User = require('../models/user');

var NetworksList = require('../views/networks-list');
var NetworkPools = require('../models/network-pools');
var NetworkPoolsList = require('../views/network-pools-list');

var TraitsEditor = require('./traits-editor');


var PackageTemplate = require('../tpl/package.hbs');

var React = require('react');
var NotesComponent = React.createFactory(require('../components/notes'));

var Handlebars = require('handlebars');
Handlebars.registerHelper('normalize', function(v) {
    v = Number(v);
    if (v % 1024 === 0) {
        return _.str.sprintf("%d GB", v / 1024);
    }

    return _.str.sprintf("%d MB", v);
});



var PackageVersions = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/package-versions.hbs'),
    attributes: {
        'id': 'package-versions'
    },
    itemView: Backbone.Marionette.ItemView.extend({
        tagName: 'li',
        template: require('../tpl/package-versions-row.hbs'),
        events: {
            'click a': 'onClickPackageVersion'
        },
        onClickPackageVersion: function() {
            adminui.vent.trigger('showview', 'package', {model: this.model });
        },
        onRender: function() {
            if (this.package.get('uuid') === this.model.get('uuid')) {
                this.$el.addClass('active');
                console.log(this.model);
            }
        }
    }),
    itemViewContainer: 'ul',
    initialize: function(options) {
        if (typeof(options.package) !== 'object') {
            throw TypeError('options.package should be a package model');
        }
        this.package = options.package;
        this.collection = new Packages();
    },
    onBeforeItemAdded: function(iv) {
        iv.package = this.package;
    },
    onShow: function() {
        this.collection.fetch({params: {name: this.package.get('name')}});
    }
});


var PackageDetail = Backbone.Marionette.Layout.extend({
    template: PackageTemplate,

    attributes: {
        id: 'page-package'
    },
    regions: {
        'versionsRegion': '.package-versions-region'
    },

    sidebar: 'packages',

    url: function() {
        return ('packages/' + this.model.get('uuid'));
    },

    events: {
        'click .change-owner': 'onChangeOwner',
        'click .new-version': 'onNewVersion',
        'click .-owner': 'onEditOwner',
        'click .traits': 'onTraits',
        'click .login': 'navigateToUser'
    },

    initialize: function(options) {
        this.nets = _.map(this.model.get('networks') || [], function(uuid) {
            return {uuid: uuid};
        });

        this.networks = new Networks(this.nets);
        this.networksView = new NetworksList({ collection: this.networks });

        this.packageVersionsView = new PackageVersions({
            package: this.model
        });

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
        adminui.vent.trigger('showcomponent', 'user', {uuid: $(e.target).attr('data-uuid')});
    },

    onChangeOwner: function() {
        adminui.vent.trigger('showview', 'packages-form', {
            model: this.model,
            mode: 'change-owner'
        });
    },

    onNewVersion: function() {
        adminui.vent.trigger('showview', 'packages-form', {
            model: this.model,
            mode: 'new-version'
        });
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
            title: _.str.sprintf('Traits Editor for package: %s', this.model.get('name'))
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
        var self = this;
        var networks = new Networks();
        networks.fetch().done(done.bind(this));

        function done() {

            self.networkPools = new NetworkPools(self.nets);

            var networkPools = self.networkPools;
            var size = networkPools.length;
            var n = 0;

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
    onShow: function() {
        this.versionsRegion.show(this.packageVersionsView);
    },


    onRender: function() {
        adminui.vent.trigger('settitle', _.str.sprintf('package: %s', this.model.get('name'), this.model.get('version')));

        if (0 === this.networks.length) {
            this.$('.networks').hide();
        }

        if (adminui.user.role('operators')) {
            React.render(
                NotesComponent({item: this.model.get('uuid')}),
                this.$('.notes-component-container').get(0));
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


module.exports = PackageDetail;
