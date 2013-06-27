var Backbone = require('backbone');
var moment = require('moment');

var adminui = require('../adminui');

var JobsList = require('./jobs-list');

var Jobs = require('../models/jobs');

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
        this.collection = options.collection || new Jobs();
        if (options.params) {
            this.collection.params = options.params;
        }
        this.collection.fetch();
        this.listenTo(this.collection, 'error', this.onError);
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    },

    onShow: function() {
        this.jobsListRegion.show(new JobsList());
        $(window).on('scroll', this.onScroll.bind(this));
    },

    onScroll: function(e) {
        if ($(window).scrollTop() + $(window).height() > $(document).height() - 50) {
            this.next();
        }
    },

    onBeforeClose: function () {
        $(window).off('scroll', this.onScroll.bind(this));
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            context: 'workflow',
            xhr: xhr
        });
    }
});


module.exports = JobsView;
