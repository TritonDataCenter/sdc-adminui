/**
 * Snapshots Table/List
 */
define(function(require) {
    var Snapshot = Backbone.Model.extend({});
    var Snapshots = Backbone.Collection.extend({});

    var SnapshotRow = Backbone.Marionette.ItemView.extend({
        tagName: 'tr',
        template: Handlebars.compile('<td>{{name}}</td><td>{{created_at}}</td>')
    });


    var View = Backbone.Marionette.CompositeView.extend({
        itemView: SnapshotRow,
        itemViewContainer: 'tbody',
        template: require('text!tpl/snapshots.html'),
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
            this.collection.reset(vm.get('snapshots'));
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
            this.vm.createSnapshot(function(snapshot) {
                console.log(snapshot);
            });
        }
    });
    return View;
});