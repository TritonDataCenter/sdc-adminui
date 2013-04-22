var adminui = require('../adminui');
var Backbone = require('backbone');
var Jobs = require('../models/jobs');
var moment = require('moment');

var JobProgressView = require('./job-progress');

var JobsItemViewTemplate = require('../tpl/jobs-item.hbs');
var JobsItemView = Backbone.Marionette.ItemView.extend({
    template: JobsItemViewTemplate,
    tagName: 'tr',
    events: {
        "click button.details": "showJobDetails"
    },
    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this, arguments);
        data.when = moment(data.exec_after).format('lll');
        return data;
    },
    showJobDetails: function() {
        var detailsView = new JobProgressView({
            model: this.model
        });
        detailsView.show();
    }
});


var JobsTemplate = require('../tpl/jobs.hbs');

var JobsItemEmptyView = Backbone.Marionette.ItemView.extend({
    tagName: 'td',
    attributes: {
        'colspan':'4'
    },
    template: '<div class="well">There are no jobs to show.</div>'
});

var JobsView = Backbone.Marionette.CompositeView.extend({
    name: 'jobs',
    id: 'page-jobs',
    template: JobsTemplate,
    itemView: JobsItemView,
    itemViewContainer: 'tbody',
    url: function() {
        return '/jobs';
    },
    emptyView: JobsItemEmptyView,
    initialize: function() {
        this.collection = new Jobs();
        this.collection.fetch();
        this.listenTo(this.collection, 'error', this.onError);
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            context: 'workflow vmapi',
            xhr: xhr
        });
    }
});


module.exports = JobsView;
