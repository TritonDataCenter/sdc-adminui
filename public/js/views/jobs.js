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
        "click a.name": "showJobDetails"
    },
    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this, arguments);
        data.when = moment(data.exec_after).format('lll');
        return data;
    },
    showJobDetails: function(e) {
        e.preventDefault();
        var detailsView = new JobProgressView({
            model: this.model
        });
        detailsView.show();
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

    initialize: function() {
        this.collection = new Jobs();
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
            context: 'workflow vmapi',
            xhr: xhr
        });
    }
});


module.exports = JobsView;
