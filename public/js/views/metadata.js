define(function(require) {
	var ko = require('knockout');
	var BaseView = require('views/base');
	var metadataViewModalTemplate = Handlebars.compile(require('text!tpl/metadata-view-modal.hbs'));
	var metadataEditModalTemplate = Handlebars.compile(require('text!tpl/metadata-edit-modal.hbs'));

	var MetadataViewModel = function(m) {
		m = m || {};
		this.key = ko.observable(m.key);
		this.value = ko.observable(m.value);
		this.multiline = ko.computed(function() {
			return (/\n/).test(this.value());
		}, this);
		this.dataIsGood = ko.computed(function() {
			return this.key() && this.value();
		}, this);
	};

	var MetadataList = Backbone.Marionette.ItemView.extend({

		template: require("text!tpl/metadata.html"),

		initialize: function(options) {
			_.bindAll(this);
			if (! options.vm) {
				throw new TypeError('options.vm required');
			}
			this.vm = options.vm;
			this.metadata = ko.observableArray([]);
		},

		showContent: function(m) {
			var view = $(metadataViewModalTemplate()).modal();
			ko.applyBindings(m, view.get(0));
			view.modal('show');
		},

		showAddPane: function() {
			var self = this;

			var view = $(metadataEditModalTemplate()).modal({
				show: false,
				backdrop:'static'
			});

			var viewModel = new MetadataViewModel();
			viewModel.editAction = this.edit;
			showAction = this.showContent;
			removeAction = this.removeItem;
			viewModel.saveAction = function(m) {
				self.metadata.push(m);
				self.save(function() {
					view.modal('hide').remove();
				});
			};

			ko.applyBindings(viewModel, view.get(0));
			view.on('shown', function() {
				console.log('shown');
				view.find('input:first').focus();
			});
			view.modal('show');
		},

		removeItem: function(m) {
			this.metadata.remove(m);
			this.save();
		},

		save: function(cb) {
			var data = {};
			_(this.metadata()).each(function(m) {
				data[m.key()] = m.value();
			});
			this.vm.set({customer_metadata:data});
			this.vm.saveCustomerMetadata(cb);
			return data;
		},

		edit: function(m) {
			var view = $(metadataEditModalTemplate()).modal({
				backdrop:'static',
				show: false
			});
			m.saveAction = function() {
				this.save(function() {
					view.modal('hide');
				});
			}.bind(this);
			ko.applyBindings(m, view.get(0));
			view.on('shown', function() {
				view.find('textarea').focus();
			});
			view.modal('show');
		},

		onRender: function() {
			_.each(this.vm.get('customer_metadata'), function(v, k) {
				var viewModel = new MetadataViewModel({key:k, value:v});
				viewModel.editAction = this.edit;
				viewModel.showAction = this.showContent;
				viewModel.removeAction = this.removeItem;
				this.metadata.push(viewModel);
			}, this);

			ko.applyBindings({
				metadata: this.metadata,
				addAction: this.showAddPane
			}, this.el);
		}
	});

	return MetadataList;
});