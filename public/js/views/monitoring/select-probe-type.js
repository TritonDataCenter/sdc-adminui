define(function(require) {
    var ProbeSelectionTemplate  = require('tpl!probe-selection');
    return Backbone.Marionette.ItemView.extend({
        template: ProbeSelectionTemplate,

        events: {
            'click a': 'selectedProbeType'
        },

        selectedProbeType: function(e) {
            var elm = $(e.currentTarget);
            var probe = elm.attr('data-probe-type');
            this.trigger('select', probe);
            this.$el.modal('hide');
        }
    });
});