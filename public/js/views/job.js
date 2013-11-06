var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var adminui = require('../adminui');

var Job = require('../models/job');

var JobView = Backbone.Marionette.ItemView.extend({
    sidebar: 'jobs',
    template: require('../tpl/job.hbs'),
    attributes: {
        'id': 'page-job'
    },

    url: function() {
        return _.str.sprintf('/jobs/%s', this.model.get('uuid'));
    },

    events: {
        'click .server a': 'navigateToServer',
        'click .vm a': 'navigateToVm'
    },

    modelEvents: {
        'sync': 'onSync',
        'error': 'onError'
    },

    initialize: function(options)  {
        if (options.uuid) {
            this.model = new Job({uuid: options.uuid});
        }
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this, arguments);
        data.finished = this.model.finished();
        data.chain_results = _.map(data.chain_results, function(task) {
            var t = _.clone(task);
            t.started_at = moment(task.started_at).format('YYYY-MM-DD HH:mm:ss');
            t.finished_at = moment(task.finished_at).format('YYYY-MM-DD HH:mm:ss');
            t.duration = moment(task.finished_at).diff(moment(task.started_at), 'seconds', true) + 's';
            return t;
        });
        return data;
    },

    navigateToServer: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'server', {uuid: this.model.get('params').server_uuid});
    },

    navigateToVm: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'vm', {uuid: this.model.get('params').vm_uuid});
    },

    onError: function(e, xhr, s) {
        adminui.vent.trigger('notification', {
            level: 'error',
            message: 'Failed to fetch job: wfapi said: ' + xhr.responseData.message,
            persistent: true
        });
        this.close();
    },

    onSync: function() {
        if (this.model.finished()) {
            this.model.stopWatching();
        }
        this.render();
    },

    onRender: function() {
        this.$('.raw').html(JSON.stringify(this.model.attributes, null, 2));
        this.$('.params').html(JSON.stringify(this.model.get('params'), null, 2));
        this.model.getJobInfo(this.renderInfo);
    },

    renderInfo: function(info) {
        this.$('.info').html(JSON.stringify(info, null, 2));
    },

    onShow: function() {
        this.model.fetch();
        this.model.startWatching();
    },

    onClose: function() {
        this.model.stopWatching();
    }
});

module.exports = JobView;
