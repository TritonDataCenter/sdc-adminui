define(function(require) {
	var Packages = require('models/packages');
	var PackagesTemplate = require('text!tpl/packages.html');
	var PackagesListItemTemplate = require('text!tpl/packages-list-item.html');
	var PackagesDetailTemplate = require('text!tpl/packages-detail-template.html');

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
		attributes: { class: 'nav nav-pills nav-stacked' },
		itemView: PackagesListItemView,
		initialize: function(options) {
			this.vent = options.vent;
		},
		onItemAdded: function(itemView) {
			this.bindTo(itemView, 'select', this.onSelect, this);
			itemView.vent = this.vent;
		},
		onSelect: function(package) {
			this.vent.trigger('showpackage', package);
		}
	});

	var PackageDetail = Backbone.Marionette.ItemView.extend({
		template: PackagesDetailTemplate,
		templateHelpers: {
			normalize: function(v) {
				if (v % 1024 == 0) {
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
			'searchInput': '.search-query'
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
			this.bindTo(this.vent, 'showpackage', this.showPackage, this);
			this.bindTo(this.packages, 'reset', this.showInitialPackage, this);
			this.list.show(packagesList);
		},

		search: function() {
			var val = this.ui.searchInput.val();
			this.packages.search(val);
		},

		showPackage: function(package) {
			this.detail.show(new PackageDetail({model: package}));
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