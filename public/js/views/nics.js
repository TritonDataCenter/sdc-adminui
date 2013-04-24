var Backbone = require('backbone');


var NicsRowView = require('./nics-row');
var JobProgress = require('./job-progress');

var NicsView = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/nics.hbs'),
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

        this.listenTo(this.selectedNics, 'add remove', this.onChangeSelectedNics, this);
        this.listenTo(this.model, 'change:nics', this.resetNics, this);
    },

    resetNics: function(vm) {
        this.collection.reset(vm.get('nics'));
    },

    onClickRemoveNics: function() {
        var confirm = window.confirm('Are you sure you want to remove selected nics?');
        if (! confirm) {
            return;
        }

        var self = this;
        var macs = this.selectedNics.pluck('mac');
        this.model.removeNics(macs, function(job) {
            var jobView = new JobProgress({model: job});
            jobView.show();
            self.listenTo(jobView, 'execution', function(st) {
                console.log(st);
                if (st === 'succeeded') {
                    self.selectedNics.each(function(n) {
                        self.collection.remove(n);
                    });
                }
            });
        });
    },

    onClickAddNic: function() {
        var AddNicView = require('./vm-add-nic');
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
        this.listenTo(itemView, 'select', this.onSelectNic, this);
        this.listenTo(itemView, 'deselect', this.onDeselectNic, this);
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

module.exports = NicsView;
