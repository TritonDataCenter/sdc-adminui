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
        if (! data.params) {
            return {};
        }

        if (data.created_at) {
            data.when = moment(data.created_at).utc().format('lll');
        } else {
            data.when = 'unknown';
        }

        if (data.name.indexOf('update') !== -1 && data.params) {

            var summary = [];
            if (data.params.new_owner_uuid) {
                summary.push('change owner');
            }

            if (data.params.package_name) {
                summary.push('resize');
            }

            if (data.params.alias) {
                summary.push('rename');
            }
            data.summary = summary.join(' + ');
        }


        console.log(data);

        data[data.execution] = true;
        return data;
    },
    showJobDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

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


var EmptyView = require('./empty');
var JobsItemEmptyView = EmptyView.extend({columns: 3});

var JobsList = Backbone.Marionette.CompositeView.extend({
    name: 'jobs',
    attributes: {
        class: 'jobs-list'
    },

    template: require('../tpl/jobs-list.hbs'),

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
        this.collection = options.collection || new Jobs({
            perPage: options.perPage,
            page: options.page
        });
        if (options.params) {
            this.collection.params = options.params;
        }
        this.collection.fetch();
        this.listenTo(this.collection, 'error', this.onError);
    },

    query: function(params) {
        this.collection.params = params;
        this.collection.fetch();
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


module.exports = JobsList;
