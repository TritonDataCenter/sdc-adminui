define(function(require) {
    var BaseView = require('views/base');
    var tplProbeSelection  = require('text!tpl/probe-selection.html');
    return BaseView.extend({
        template: tplProbeSelection,

        initialize: function(options) {
            _.bindAll(this);
        },

        events: {
            'click a': 'selectedProbeType'
        },

        selectedProbeType: function(e) {
            var elm = $(e.currentTarget);
            var probe = elm.attr('data-probe-type');
            this.trigger('select', probe);
            this.$el.modal('hide');
        },

        render: function() {
            this.setElement(this.template());
            return this;
        }
    });
});