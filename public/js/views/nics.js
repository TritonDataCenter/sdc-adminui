define(function(require) {
    var NicRowView = Backbone.Marionette.ItemView.extend({
        tagName: 'tr',
        template: require('text!tpl/nics-row.html'),
        events: {
            'change input': 'onSelect'
        },
        onSelect: function(e) {
            var checked = this.$('input').is(':checked');

            if (checked) {
                this.$el.addClass('selected');
                this.trigger('select', this.model);
            } else {
                this.$el.removeClass('selected');
                this.trigger('deselect', this.model);
            }
        }

    });

    var NicsView = Backbone.Marionette.CompositeView.extend({
        template: require('text!tpl/nics.html'),
        itemView: NicRowView,
        itemViewContainer: 'tbody',

        initialize: function(options)  {
            this.model = options.vm;
            this.selectedNics = new Backbone.Collection();
            this.collection = new Backbone.Collection(this.model.get('nics'));
            
            this.bindTo(this.selectedNics, 'add remove', this.onChangeSelectedNics, this);
            this.bindTo(this.model, 'change:nics', this.resetNics, this);
        },

        resetNics: function(vm) {
            this.collection.reset(vm.get('nics'));
        },

        onChangeSelectedNics: function() {
            if (this.selectedNics.length > 0) {
                this.enableActions();
            } else {
                this.disableActions();
            }
        },

        enableActions: function() {
            this.$(".btn-group").show();
        },

        disableActions: function() {
            this.$(".btn-group").hide();
        },

        onBeforeItemAdded: function(itemView) {
            this.bindTo(itemView, 'select', this.onSelectNic, this);
            this.bindTo(itemView, 'deselect', this.onDeselectNic, this);
        },
        onSelectNic: function(nic) {
            this.selectedNics.add(nic);
        },

        onDeselectNic: function(nic) {
            this.selectedNics.remove(nic);
        },

        onRender: function() {
            this.disableActions();
        }

    });

    return NicsView;
});