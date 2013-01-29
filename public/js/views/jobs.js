define(function(require) {
    var Jobs = require('models/jobs');

    var JobsItemViewTemplate = require('tpl!jobs-item');
    var JobsItemView = Backbone.Marionette.ItemView.extend({
        template: JobsItemViewTemplate,
        tagName: 'tr'
    });

    var JobsTemplate = require('tpl!jobs');
    var JobsView = Backbone.Marionette.CompositeView.extend({
        name: 'jobs',
        template: JobsTemplate,
        url: function() { return '/jobs'; },
        itemView: JobsItemView,
        itemViewContainer: 'tbody',
        initialize: function() {
            this.collection = new Jobs();
            this.collection.fetch();
        },
        onRender: function() {
        }
    });


    return JobsView;
});