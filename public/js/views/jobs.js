var Backbone = require('backbone');
var moment = require('moment');

var adminui = require('../adminui');

var JobsList = require('./jobs-list');
var JobsFilter = require('./jobs-filter');

var JobsView = Backbone.Marionette.Layout.extend({
    name: 'jobs',
    id: 'page-jobs',
    template: require('../tpl/jobs.hbs'),

    regions: {
        'jobsListRegion': '.jobs-list-region',
        'jobsFilterRegion': '.jobs-filter-region'
    },

    url: function() {
        return '/jobs';
    },

    initialize: function(options) {
        options = options || {};
    },

    onShow: function() {
        this.jobsList = new JobsList({params: {'execution': 'failed'}});
        this.jobsFilter = new JobsFilter();
        this.jobsFilterRegion.show(this.jobsFilter);
        this.jobsListRegion.show(this.jobsList);

        this.listenTo(this.jobsFilter, 'query', function(params) {
            this.jobsList.query(params);
        }, this);
    },
});


module.exports = JobsView;
