/**
 * Snapshots Table/List
 */
define(function(require) {
    var Snapshot = Backbone.Model.extend({});
    var Snapshots = Backbone.Collection.extend({});

    var SnapshotRow = Backbone.Marionette.ItemView.extend({
        tagName: 'tr',
        template: Handlebars.compile('<td>{{name}}</td>')
    });


    var View = Backbone.Marionette.CompositeView.extend({
        itemView: SnapshotRow,
        itemViewContainer: 'tbody',
        template: require('text!tpl/snapshots.html'),
        initialize: function(options) {
            this.collection = new Snapshots(options.vm.get('snapshots'));
        },
        serializeData: function() {
            return {snapshots: this.collection};
        },
        onShow: function() {
            this.collection.add(new Snapshot({name:'hello'}));
        }
    });
    return View;
});