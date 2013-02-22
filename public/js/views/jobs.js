define(function(require) {
    var Backbone = require('backbone');
    var Jobs = require('models/jobs');

    var JobProgressView = require('views/job-progress');
    
    var JobsItemViewTemplate = require('tpl!jobs-item');
    var JobsItemView = Backbone.Marionette.ItemView.extend({
        template: JobsItemViewTemplate,
        tagName: 'tr',
        events: {
            "click button.details": "showJobDetails"
        },
        showJobDetails: function() {
            var detailsView = new JobProgressView({model: this.model});
            detailsView.show();
        }
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
        }
    });


    return JobsView;
});