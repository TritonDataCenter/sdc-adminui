define(['views/base'], function(BaseView) {
    return BaseView.extend({
        template: 'probe-selection',

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