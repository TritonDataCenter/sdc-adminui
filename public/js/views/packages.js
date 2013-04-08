define(function(require) {
    var Backbone = require('backbone');

    var Packages = require('models/packages');
    var PackagesTemplate = require('text!tpl/packages.html');
    var PackagesListItemTemplate = require('text!tpl/packages-list-item.html');
    var PackagesDetailTemplate = require('text!tpl/packages-detail-template.html');
    var PackageForm = require('views/packages-form');

    var adminui = require('adminui');

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
            this.bindTo(this.vent, 'highlight', this.highlightIfThis, this);
        },

        highlightIfThis: function(model) {
            if (model == this.model) {
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
        attributes: { 'class': 'nav' },
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
            this.bindTo(itemView, 'select', this.onSelect, this);
            itemView.vent = this.vent;
        },

        onSelect: function(pkg) {
            this.vent.trigger('showpackage', pkg);
        }
    });

    var TraitsEditor = require('views/traits-editor');
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
        },

        onEdit: function() {
            this.vent.trigger('showedit', this.model);
        },

        onSaveTraits: function(traits) {
            var that = this;
            this.model.set();
            this.model.save(
                {traits: traits},
                {success: function() {
                that.traitsEditor.close();
                that.model.fetch();
            }});
        },

        onTraits: function() {
            this.traitsEditor = new TraitsEditor();
            this.traitsEditor.traits = this.model.get('traits');
            this.bindTo(this.traitsEditor, 'save-traits', this.onSaveTraits);
            this.traitsEditor.show();
        },

        templateHelpers: {
            normalize: function(v) {
                if (v % 1024 === 0) {
                    return _.str.sprintf("%d GB", v/1024);
                }

                return _.str.sprintf("%d MB", v);
            }
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
            this.packages.fetch();
            this.bindTo(this.packages, 'error', this.onError);

            this.initialPackageUUID = options.uuid;
            this.vent = new Marionette.EventAggregator();
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

            this.bindTo(this.ui.searchInput, 'input', this.search, this);
            this.bindTo(this.ui.createButton, 'click', this.onClickCreateButton, this);

            this.bindTo(this.vent, 'showpackage', this.showPackage, this);
            this.bindTo(this.vent, 'showedit', this.showForm, this);
            this.bindTo(this.packages, 'reset', this.showInitialPackage, this);

            this.bindTo(this.detail, 'show', function(view) {
                adminui.router.applyUrl(view);
            });

            this.list.show(packagesList);
        },

        onClickCreateButton: function() {
            this.showForm();
        },

        search: function() {
            var val = this.ui.searchInput.val();
            this.packages.search(val);
        },

        showForm: function(model) {
            if (!model) {
                this.$(".sidebar").animate({opacity: 0.4});
                this.list.currentView.deselect();
            }
            var form = new PackageForm({model:model});
            this.detail.show(form);
            this.detail.currentView.vent = this.vent;
        },

        showPackage: function(pkg) {
            if (! pkg) {
                this.showInitialPackage();
                return;
            }

            this.$(".sidebar").animate({opacity: 1});

            if ((!this.detail.currentView) ||
                (this.detail.currentView.model !== pkg || (false === this.detail.currentView instanceof(PackageDetail)))) {
                this.detail.show(new PackageDetail({model: pkg}));
            }

            if (! this.packages.get(pkg.get('uuid'))) {
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


    return PackagesView;
});