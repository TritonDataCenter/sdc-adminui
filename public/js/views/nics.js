var Backbone = require('backbone');
var Networks = require('../models/networks');
var Nics = require('../models/nics');

var NicsRowView = require('./nics-row');
var JobProgress = require('./job-progress');

var NicsView = Backbone.Marionette.CompositeView.extend({
    template: require('../tpl/nics.hbs'),
    itemView: NicsRowView,
    itemViewContainer: 'tbody',
    attributes: {
        id: "vm-nics"
    },
    events: {
        'click button.add-nic': 'onClickAddNic',
        'click button.remove-nics': 'onClickRemoveNics'
    },

    initialize: function(options)  {
        this.model = options.vm;
        this.selectedNics = new Backbone.Collection();
        this.collection = new Nics(null, {
            params: {
                belongs_to_type: 'zone',
                belongs_to_uuid: this.model.get('uuid')
            }
        });
        this.collection.fetch();

        this.networks = new Networks();
        this.networks.fetch();

        this.listenTo(this.networks, 'sync', this.networksLoaded, this);
        this.listenTo(this.selectedNics, 'add remove reset', this.onChangeSelectedNics, this);
        this.listenTo(this.model, 'change:nics', this.resetNics, this);
    },

    networksLoaded: function() {
        this.render();
    },

    resetNics: function() {
        this.collection.fetch();
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
            self.listenTo(jobView, 'succeeded', function() {
                self.selectedNics.each(function(n) {
                    self.collection.remove(n);
                });
                self.selectedNics.reset();
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
        this.$(".remove-nics").show();
    },

    disableActions: function() {
        this.$(".remove-nics").hide();
    },

    onBeforeItemAdded: function(itemView) {
        this.listenTo(itemView, 'select', this.onSelectNic, this);
        this.listenTo(itemView, 'deselect', this.onDeselectNic, this);
        itemView.network = this.networks.get(itemView.model.get('network_uuid'));
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
