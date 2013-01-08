define(function(require) {

    var NicsRowView = Backbone.Marionette.ItemView.extend({
        tagName: 'tr',
        template: require('text!tpl/nics-row.html'),

        events: {
            'change input': 'onSelect'
        },

        onSelect: function(e) {
            var checked = this.$('input').is(':checked');

            if (checked) {
                this.$el.addClass('selected');
                this.trigger('select', this.model);
            } else {
                this.$el.removeClass('selected');
                this.trigger('deselect', this.model);
            }
        }

    });
    return NicsRowView;
});