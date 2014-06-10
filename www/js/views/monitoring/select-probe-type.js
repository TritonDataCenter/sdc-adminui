var Backbone = require('backbone');
var ProbeSelectionTemplate  = require('../../tpl/probe-selection.hbs');

module.exports = Backbone.Marionette.ItemView.extend({
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