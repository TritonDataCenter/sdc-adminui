define(function(require) {
    var Backbone = require('backbone');

    var JobProgressView = Backbone.Marionette.ItemView.extend({
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
            var modal  =this.$el.modal();
            modal.on('hide', this.onClose);
            this._timer = setInterval(this.update.bind(this), 3000);
        },
        update: function() {
            this.model.fetch();
            this.trigger('execution', this.model.get('execution'));
        },
        onClose: function() {
            clearInterval(this._timer);
        }
    });

    return JobProgressView;
});