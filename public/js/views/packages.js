var Backbone = require('backbone');
var _ = require('underscore');

var Packages = require('../models/packages');

var PackagesTemplate = require('../tpl/packages.hbs');
var PackagesListItemTemplate = require('../tpl/packages-list-item.hbs');
var PackageForm = require('./packages-form');

var User = require('../models/user');

var adminui = require('../adminui');

var PackagesListItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: PackagesListItemTemplate,
    events: {
        'click': 'select'
    },
    select: function() {
        this.trigger('select', this.model);
    }
});



var PackagesList = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
        'class': 'nav'
    },

    itemView: PackagesListItemView,

    onBeforeItemAdded: function(itemView) {
        this.listenTo(itemView, 'select', this.onSelect, this);
    },

    onSelect: function(pkg) {
        adminui.vent.trigger('showview', 'package', {model: pkg});
    }
});




var PackagesView = Backbone.Marionette.Layout.extend({
    regions: {
        'list': '#list',
        'detail': '#detail'
    },

    attributes: {
        id: "page-packages"
    },

    events: {
        'click button.create': 'showCreateForm'
    },

    ui: {
        'searchInput': '.search input',
        'createButton': 'button.create'
    },

    sidebar: 'packages',

    url: 'packages',

    template: PackagesTemplate,

    initialize: function(options) {
        options = options || {};
        this.packages = new Packages();
        this.listenTo(this.packages, 'error', this.onError);
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            xhr: xhr,
            context: 'packages / ufds',
            message: 'error occurred while retrieving package information'
        });
    },

    onRender: function() {
        var packagesList = new PackagesList({collection: this.packages });

        this.ui.searchInput.on('input', this.search.bind(this));

        var that = this;

        if (that.packagesCache && that.packagesCache.length) {
            that.packages.reset(that.packagesCache);
            packagesList.render();
        } else {
            this.packages.fetch().done(function() {
                that.packages.sort();
                that.packagesCache = that.packages.models;
                packagesList.render();
            });
        }
        this.list.show(packagesList);
    },

    showCreateForm: function() {
        adminui.vent.trigger('showview', 'packages-form');
    },

    search: function() {
        var val = this.ui.searchInput.val();
        this.packages.search(val);
    },

    showForm: function(model) {
        if (!model) {
            this.$(".sidebar").animate({ opacity: 0.4 });
            this.list.currentView.deselect();
        }

    }

});


module.exports = PackagesView;
