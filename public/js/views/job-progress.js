var Backbone = require('backbone');
var moment = require('moment');
var _ = require('underscore');

var JobProgressView = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'modal',
        'id': 'job-progress'
    },
    template: require('../tpl/job-progress.hbs'),
    events: {
        'click .toggle-raw': 'toggleRaw'
    },
    initialize: function() {
        this.listenTo(this.model, 'sync', this.render, this);
    },

    toggleRaw: function() {
        this.$('.raw').html(JSON.stringify(this.model.attributes, null, 2));
        this.$('.raw').toggle();
        this.$('.summary').toggle();
        if (this.$('.raw').is(':visible')) {
            this.$('.modal-body').addClass('raw-enabled');
            this.$('.toggle-raw').html('Show Summary');
        } else {
            this.$('.modal-body').removeClass('raw-enabled');
            this.$('.toggle-raw').html('Show Raw');
        }
    },

    serializeData: function() {
        var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this, arguments);
        data.chain_results = _.map(data.chain_results, function(task) {
            var t = _.clone(task);
            t.started_at = moment(task.started_at).format('YYYY-MM-DD HH:mm:ss');
            t.finished_at = moment(task.finished_at).format('YYYY-MM-DD HH:mm:ss');
            t.duration = moment(task.finished_at).diff(moment(task.started_at), 'seconds', true) + 's';
            return t;
        });
        return data;
    },

    templateHelpers: {
        'finished': function() {
            return this.execution === 'succeeded' || this.execution === 'failed';
        }
    },
    show: function() {
        this.model.fetch();
        this._timer = setInterval(this.update.bind(this), 3000);
        var modal = this.$el.modal();
        var timer = this._timer;
        modal.on('hidden', function() {
            clearInterval(timer);
        });
    },
    update: function() {
        this.model.fetch({success: this.onUpdate.bind(this)});
    },

    onRender: function() {
        this.$('.modal-body').scrollTop(this.$('.modal-body')[0].scrollHeight);
    },

    onUpdate: function() {
        var execution = this.model.get('execution');

        if (execution === 'cancelled' ||
            execution === 'succeeded' || execution === 'failed') {
            this.trigger(execution);
            clearInterval(this._timer);
        }

        this.trigger('execution', this.model.get('execution'));
    }
});

module.exports = JobProgressView;
