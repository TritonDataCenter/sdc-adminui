define(function(require) {
    var Template = require('tpl!monitoring-machine-up-probe');

    return Backbone.Marionette.ItemView.extend({

        template: Template,

        events: {
            'click button': 'done'
        },

        initialize: function(options) {
            options = options || {};

            this.params = {
                type: 'machine-up',
                agent: options.vm.get('uuid'),
                name: _.str.sprintf('machine-up-%s', options.vm.get('alias'))
            };
        },

        focus: function() {
            return this;
        },

        onRender: function() {
            return this;
        },

        done: function() {
            this.trigger('done', this.params);
        },

        hide: function() {
            this.$el.modal('hide');
        }
    });

});