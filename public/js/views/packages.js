define(function(require) {
    var Backbone = require('backbone');

    var Packages = require('models/packages');
    var PackagesTemplate = require('text!tpl/packages.html');
    var PackagesListItemTemplate = require('text!tpl/packages-list-item.html');
    var PackagesDetailTemplate = require('text!tpl/packages-detail-template.html');
    var PackageForm = require('views/packages-form');

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
            _(this.children).each(function(c) {
                c.unhighlight();
            }, this);
        },

        onItemAdded: function(itemView) {
            this.bindTo(itemView, 'select', this.onSelect, this);
            itemView.vent = this.vent;
        },

        onSelect: function(pkg) {
            this.vent.trigger('showpackage', pkg);
        }
    });

    var PackageDetail = Backbone.Marionette.ItemView.extend({
        template: PackagesDetailTemplate,
        events: {
            'click .edit': 'onEdit'
        },

        onEdit: function() {
            this.vent.trigger('showedit', this.model);
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

        uri: 'packages',

        template: PackagesTemplate,

        initialize: function(options) {
            this.packages = new Packages();
            this.packages.fetch();

            this.vent = new Marionette.EventAggregator();
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
            if (this.packages.length) {
                this.showPackage(this.packages.at(0));
                this.vent.trigger('highlight', this.packages.at(0));
            } else {
                this.detail.reset();
            }
        }
    });


    return PackagesView;
});