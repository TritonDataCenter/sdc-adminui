var Backbone = require('backbone');


/**
 * Snapshots Table/List
 */
var Snapshot = Backbone.Model.extend({});
var Snapshots = Backbone.Collection.extend({});
var JobProgressView = require('./job-progress');

var SnapshotRowTemplate = require('../tpl/snapshots-row.hbs');
var SnapshotRow = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: SnapshotRowTemplate,
    events: {
        'click .rollback': 'rollbackToSnapshot'
    },
    rollbackToSnapshot: function() {
        var name = this.model.get('name');
        var self = this;
        var vm = this.vm;
        vm.rollbackSnapshot(name, function(job) {
            var jobView = new JobProgressView({model: job});
            self.bindTo(jobView, 'execution', function(exec) {
                if (exec === 'succeeded') {
                    vm.fetch();
                }
            });
            jobView.show();
        });
    }
});


var View = Backbone.Marionette.CompositeView.extend({
    itemView: SnapshotRow,
    itemViewContainer: 'tbody',
    template: require('../tpl/snapshots.hbs'),
    events: {
        'click button': 'clickedCreateSnapshot'
    },
    initialize: function(options) {
        this.vm = options.vm;
        this.collection = new Snapshots(this.vm.get('snapshots'));
        this.bindTo(this.collection, "add", this.render, this);
        this.bindTo(this.collection, "remove", this.render, this);
        this.bindTo(this.collection, "reset", this.render, this);
        this.bindTo(this.vm, 'change:snapshots', this.resetSnapshots, this);
    },
    resetSnapshots: function(vm, n) {
        console.log('reset');
        this.collection.reset(vm.get('snapshots'));
    },
    onBeforeItemAdded: function(view) {
        view.vm = this.vm;
    },
    templateHelpers: function() {
        var self = this;
        return {
            snapshots: this.collection,
            hasSnapshots: function(data) {
                return self.collection.length > 0;
            }
        };
    },
    clickedCreateSnapshot: function() {
        var vm = this.vm;
        var self = this;
        this.vm.createSnapshot(function(job) {
            var jobView = new JobProgressView({model: job});
            self.bindTo(jobView, 'execution', function(exec) {
                console.log(exec);
                if (exec === 'succeeded') {
                    vm.fetch();
                }
            });
            jobView.show();
        });
    }
});
module.exports = View;
