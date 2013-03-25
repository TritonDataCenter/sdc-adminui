define(function(require) {
    var Marionette= require('backbone.marionette');

    var JobProgressView = Marionette.ItemView.extend({
        attributes: {
            'class': 'modal',
            'id': 'job-progress'
        },
        template: require('tpl!job-progress'),
        initialize: function() {
            this.model.fetch();
            this.bindTo(this.model, 'change', this.render, this);
        },
        templateHelpers: {
            'finished': function() {
                return this.execution === 'succeeded' || this.execution === 'failed';
            }
        },
        show: function() {
            this.render();
            var modal = this.$el.modal();
            this.bindTo(modal, 'hide', this.onClose);
            this._timer = setInterval(this.update.bind(this), 3000);
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
        },
        onClose: function() {
            clearInterval(this._timer);
        }
    });

    return JobProgressView;
});