var Backbone = require('backbone');

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
        this.model.fetch();
        this.listenTo(this.model, 'change', this.render, this);
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

    templateHelpers: {
        'finished': function() {
            return this.execution === 'succeeded' || this.execution === 'failed';
        }
    },
    show: function() {
        this.render();
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
    onUpdate: function() {
        var execution = this.model.get('execution');

        if (execution === 'succeeded' || execution === 'failed') {
            clearInterval(this._timer);
        }

        this.trigger('execution', this.model.get('execution'));
    }
});

module.exports = JobProgressView;
