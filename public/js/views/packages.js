var Backbone = require('backbone');
var _ = require('underscore');

var Packages = require('../models/packages');
var PackagesTemplate = require('../tpl/packages.hbs');
var PackagesListItemTemplate = require('../tpl/packages-list-item.hbs');
var PackageForm = require('./packages-form');

var adminui = require('../adminui');

var PackagesListItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: PackagesListItemTemplate,
    events: {
        'click': 'select'
    },

    initialize: function(options) {
        this.vent = options.vent;
    },

    onRender: function() {
        this.listenTo(this.vent, 'highlight', this.highlightIfThis, this);
    },

    highlightIfThis: function(model) {
        if (model === this.model) {
            this.highlight();
        }
    },
    unhighlight: function() {
        this.$el.siblings().removeClass('active');
    },

    highlight: function() {
        this.$el.siblings().removeClass('active');
        this.$el.addClass('active');
    },

    select: function() {
        this.highlight();
        this.trigger('select', this.model);
    }
});

var PackagesList = Backbone.Marionette.CollectionView.extend({
    tagName: 'ul',
    attributes: {
        'class': 'nav'
    },
    itemView: PackagesListItemView,
    initialize: function(options) {
        this.vent = options.vent;
    },

    deselect: function() {
        this.children.each(function(c) {
            c.unhighlight();
        }, this);
    },

    onBeforeItemAdded: function(itemView) {
        this.listenTo(itemView, 'select', this.onSelect, this);
        itemView.vent = this.vent;
    },

    onSelect: function(pkg) {
        this.vent.trigger('showpackage', pkg);
    }
});

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

var Networks = require('../models/networks');
var Network = require('../models/network');
var NetworksList = require('../views/networks-list');
var NetworksDetailView = require('./networks-detail');
var PackageDetail = Backbone.Marionette.ItemView.extend({
    template: PackagesDetailTemplate,
    url: function() {
        return 'packages/' + this.model.get('uuid');
    },
    events: {
        'click .edit': 'onEdit',
        'click .traits': 'onTraits'
    },

    initialize: function(options) {
        var nets = _.map(this.model.get('networks') || [], function(uuid) {
            return {uuid: uuid};
        });
        this.networks = new Networks();
        this.networks.reset(nets);
        this.networksView = new NetworksList({ collection: this.networks });
        this.listenTo(this.networksView, 'select', this.onSelectNetwork);
    },

    onEdit: function() {
        this.vent.trigger('showedit', this.model);
    },

    onSelectNetwork: function(model) {
        var view = new NetworksDetailView({model: model});
        view.render();
        view.$el.modal('show');
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

    onRender: function() {
        if (0 === this.networks.length) {
            this.$('.networks').hide();
        }
        this.$('.networks-list').html(this.networksView.el);
        this.networksView.render();
        var networksView = this.networksView;
        var networks = this.networks;
        networks.each(function(n) {
            n.fetch().done(function() {
                networksView.children.findByModel(n).render();
            });
        });
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

        this.initialPackageUUID = options.uuid;
        this.vent = new Backbone.Wreqr.EventAggregator();
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            xhr: xhr,
            context: 'packages / ufds',
            message: 'error occured while retrieving package information'
        });
    },

    onRender: function() {
        var packagesList = new PackagesList({
            collection: this.packages,
            vent: this.vent
        });

        this.ui.searchInput.on('input', this.search, this);

        this.listenTo(this.vent, 'showpackage', this.showPackage, this);
        this.listenTo(this.vent, 'showedit', this.showForm, this);

        this.listenTo(this.detail, 'show', function(view) {
            adminui.router.applyUrl(view);
        });
        var that = this;
        this.packages.fetch().done(function() {
            that.showInitialPackage();
        });
        this.list.show(packagesList);
    },

    showCreateForm: function() {
        this.showForm();
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
        var form = new PackageForm({ model: model });
        this.detail.show(form);
        this.detail.currentView.vent = this.vent;
    },

    showPackage: function(pkg) {
        if (!pkg) {
            this.showInitialPackage();
            return;
        }

        this.$(".sidebar").animate({
            opacity: 1
        });

        if ((!this.detail.currentView) || (this.detail.currentView.model !== pkg || (false === this.detail.currentView instanceof(PackageDetail)))) {
            this.detail.show(new PackageDetail({
                model: pkg
            }));
        }

        if (!this.packages.get(pkg.get('uuid'))) {
            this.packages.add(pkg);
        }

        this.vent.trigger('highlight', pkg);

        this.detail.currentView.vent = this.vent;
    },

    showInitialPackage: function() {
        var pkg;
        if (this.initialPackageUUID) {
            pkg = this.packages.get(this.initialPackageUUID);
        } else {
            pkg = this.packages.at(0);
        }

        if (pkg) {
            this.showPackage(pkg);
        } else {
            this.detail.reset();
        }
    }
});


module.exports = PackagesView;
