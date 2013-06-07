var Backbone = require('backbone');
var moment = require('moment');

var adminui = require('../adminui');
var Jobs = require('../models/jobs');

var JobProgressView = require('./job-progress');
var JobDetailsView = require('./job');

var JobsItemViewTemplate = require('../tpl/jobs-item.hbs');
var JobsItemView = Backbone.Marionette.ItemView.extend({
    template: JobsItemViewTemplate,
    tagName: 'tr',
    events: {
        "click a.name": "showJobDetails"
    },
    initialize: function(options) {
        options.showDetailsInModal = options.showdetailsInModal || false;

        if (options.showDetailsInModal) {
            this.detailsView = JobProgressView;
        } else {
            this.detailsView = JobDetailsView;
        }
    },
    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this, arguments);
        data.when = moment(data.exec_after).utc().format('lll');
        return data;
    },
    showJobDetails: function(e) {
        e.preventDefault();
        var View = this.detailsView;

        if (this.detailsView === JobProgressView) {
            var detailsView = View({model: this.model});
            detailsView.show();
        } else {
            adminui.vent.trigger('showview', 'job', { model: this.model });
        }
    }
});


var JobsTemplate = require('../tpl/jobs.hbs');

var EmptyView = require('./empty');
var JobsItemEmptyView = EmptyView.extend({columns: 3});

var JobsView = Backbone.Marionette.CompositeView.extend({
    name: 'jobs',
    id: 'page-jobs',
    template: JobsTemplate,
    itemView: JobsItemView,
    itemViewContainer: 'tbody',
    itemViewOptions: function() {
        return { emptyViewModel: this.collection };
    },
    url: function() {
        return '/jobs';
    },

    emptyView: JobsItemEmptyView,

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
