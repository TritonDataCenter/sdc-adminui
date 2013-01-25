define(function(require) {
    var NicsRowView = require('views/nics-row');

    var NicsView = Backbone.Marionette.CompositeView.extend({
        template: require('text!tpl/nics.html'),
        itemView: NicsRowView,
        itemViewContainer: 'tbody',
        events: {
            'click button.add-nic': 'onClickAddNic',
            'click button.remove-nics': 'onClickRemoveNics'
        },

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

        onClickRemoveNics: function() {
            var self = this;
            var macs = this.selectedNics.pluck('mac');
            this.model.removeNics(macs, function() {
                self.selectedNics.each(function(n) {
                    self.collection.remove(n);
                });
            });
        },

        onClickAddNic: function() {
            var AddNicView = require('views/vm-add-nic');
            var view = new AddNicView({vm: this.model});
            view.render();
        },

        onChangeSelectedNics: function() {
            if (this.selectedNics.length > 0) {
                this.enableActions();
            } else {
                this.disableActions();
            }
        },

        enableActions: function() {
            this.$(".btn-group .remove-nics").show();
        },

        disableActions: function() {
            this.$(".btn-group .remove-nics").hide();
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