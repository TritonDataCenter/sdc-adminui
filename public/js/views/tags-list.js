define(function(require) {

	var BaseView = require('views/base');

	var EditingView = BaseView.extend({
		tagName: 'tr',
		template: require('text!tpl/tags-list-editing.html'),
		events: {
			'click .edit': 'edit',
			'click .cancel': 'cancel',
			'click .save': 'save'
		},

		initialize: function(options) {
			_.bindAll(this);

			this.model = new Backbone.Model();

			this.model.on('change:editing', function() {
				if (this.model.get('editing') == true) {
					this.$el.addClass('editing');
				} else {
					this.$el.removeClass('editing');
				}
			}, this);

			if (options.editing) {
				this.model.set({editing: options.editing});
			}

			this.model.on('change', this.render);

			this.tag = {};
			this.tag.name = options.name || '';
			this.tag.value = options.value || '';
		},

		cancel: function() {
			this.model.set({editing: false});
			this.trigger('cancel');
		},

		edit: function() {
			this.model.set({editing: true});
		},

		save: function() {
			this.tag.name = this.$('input[name=name]').val();
			this.tag.value = this.$('input[name=value]').val();
			this.trigger('save', this.tag);
			this.model.set({editing:false});
		},


		render: function() {
			var tpl = this.template({
				editing: this.model.get('editing'),
				tag: this.tag
			});
			this.$el.html(tpl);
			this.focus();
			return this;
		},

		focus: function() {
			this.$('input:first').focus();
		}

	});

	var TagsList = BaseView.extend({
		template: require('text!tpl/tags-list.html'),

		events: {
			'click .add-tag': 'addTag'
		},

		initialize: function(options) {
			_.bindAll(this);

			if (! options.vm) {
				throw new TypeError('options.vm required');
			}
			this.vm = options.vm;
		},

		addTag: function() {
			var addTagButton = this.$('.add-tag');
			addTagButton.hide();

			var addView = new EditingView({editing:true});
			addView.on('cancel', function() {
				addTagButton.show();
				addView.remove();
			});

			addView.on('save', function(tag) {
				var tags = this.vm.get('tags');
				tags[tag.name] = tag.value;
				this.vm.set({tags: tags});
				this.vm.save();
				this.render();
			}, this);

			addView.render();

			this.$('tfoot').append(addView.$el);
			addView.focus();
		},

		render: function() {
			this.$el.html(this.template());

			var tags = this.vm.get('tags');
			_(tags).each(function(tv, tn) {
				var view = new EditingView({ name: tn, value: tv });
				view.on('save', function(tag) {
					delete tags[tn];
					tags[tag.name] = tag.value;
					console.log(tags);
					this.vm.save({tags:tags});
				}, this)
				this.$('tbody').append(view.$el);
				view.render();
			}, this);
			return this;
		}

	});

	return TagsList;
});