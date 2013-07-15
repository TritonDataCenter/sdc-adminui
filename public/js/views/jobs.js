var Backbone = require('backbone');
var moment = require('moment');

var adminui = require('../adminui');

var JobsList = require('./jobs-list');
var JobsView = Backbone.Marionette.Layout.extend({
    name: 'jobs',
    id: 'page-jobs',
    template: require('../tpl/jobs.hbs'),

    regions: {
        'jobsListRegion': '.jobs-list-region'
    },

    url: function() {
        return '/jobs';
    },

    initialize: function(options) {
        options = options || {};
    },

    onShow: function() {
        this.jobsListRegion.show(new JobsList());
    },
});


module.exports = JobsView;
