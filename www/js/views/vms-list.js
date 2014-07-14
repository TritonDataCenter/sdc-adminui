"use strict";

var Backbone = require('backbone');
var ItemTemplate = require('../tpl/vms-list-item.hbs');
var adminui = require('../adminui');
var Vms = require('../models/vms');
var React = require('react');

var Images = require('../models/images');
var User = require('../models/user');
var Package = require('../models/package');
var JSONExport = require('../components/json-export.jsx');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: ItemTemplate,

    events: {
        'click .alias a': 'navigateToVmDetails',
        'click a.owner-name': 'navigateToOwnerDetails'
    },

    initialize: function(options) {
        this.user = new User({uuid: options.model.get('owner_uuid')});
        this.pkg = new Package({uuid: options.model.get('billing_id')});
    },

    onShow: function() {
        var self = this;
        var user = this.user;
        var pkg = this.pkg;
        var vm = this.model;

        this.user.fetch().done(function() {
            self.$('.owner-name').html(user.get('login'));
            self.$('.owner-name').attr("href", "/users/" + user.get('uuid'));
            if (user.get('company') && user.get('company').length) {
                self.$('.owner-company').html(user.get('company'));
                self.$('.owner-company-container').show();
            } else {
                self.$('.owner-company-container').hide();
            }
        });

        if (! (vm.get('package_name') && vm.get('package_version'))) {
            pkg.fetch().done(function() {
                self.$('.package-name').html(pkg.get('name'));
                self.$('.package-version').html(pkg.get('version'));
            });
        }
    },
    onRender: function() {
        this.$('.owner-company-container').hide();
    },


    serializeData: function() {
        var data = this.model.toJSON();
        data.image = this.images.get(data.image_uuid);
        if (data.image) {
            data.image = data.image.toJSON();
        }
        data.ips = data.nics.map(function(n) {
            return n.ip;
        });
        return data;
    },

    navigateToVmDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'vm', { vm: this.model });
    },
    navigateToOwnerDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showcomponent', 'user', { user: this.user });
    }
});

module.exports = require('./composite').extend({
    itemView: ItemView,
    itemViewContainer: 'tbody',
    attributes: {
        'class':'vms-list'
    },

    events: {
        'click a.more': 'onNext',
        'click a.all': 'onAll',
        'click a.export': 'onExport'
    },

    collectionEvents: {
        'sync': 'onSync',
        'request': 'onRequest'
    },

    template: require('../tpl/vms-list.hbs'),
    emptyView: require('./empty').extend({
        loadingMessage: 'Loading Virtual Machines...',
        emptyMessage: 'No Virtual Machines found',
        columns: 4
    }),

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    initialize: function() {
        this.images = new Images();
        this.images.fetch().done(this.render);
        this.listenTo(this.collection, 'request', this.onRequest, this);
    },

    onBeforeItemAdded: function(iv) {
        iv.images = this.images;
        iv.usersCache = new Backbone.Collection();
    },

    onExport: function(e) {
        e.preventDefault();
        var vms = new Vms({params: this.collection.params});
        var node = this.$('.export-container').get(0);
        vms.exportGroupedByCustomer().done(function(exported) {
            React.renderComponent(new JSONExport({
                description: "Virtual Machines grouped by owner",
                data: exported,
                onRequestHide: function() {
                    React.unmountComponentAtNode(node);
                }
            }), node);
        }.bind(this));
    },

    onNext: function() {
        this.next();
    },

    onAll: function() {
        this.collection.pagingParams.perPage = null;
        this.collection.fetch({remove: false});
    },

    onRender: function() {
        if (this.collection.length) {
            this.$('caption').css('visibility', 'visible');
        } else {
            this.$('caption').css('visibility', 'hidden');
        }
        this.onSync();
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    },

    onRequest: function() {
        this.$('caption').css('visibility', 'hidden');
    },

    onSync: function() {
        if (! this.collection.objectCount) {
            this.$('.more').hide();
            this.$('.all').hide();
        } else {
            if (this.collection.objectCount === this.collection.length) {
                this.$('.more').hide();
                this.$('.all').hide();
            } else {
                this.$('.more').show();
                this.$('.all').show();
            }
        }

        this.$('caption').css('visibility', 'visible');
        this.$('.record-count').html(this.collection.objectCount);
        this.$('.current-count').html(this.collection.length);
    }

});
