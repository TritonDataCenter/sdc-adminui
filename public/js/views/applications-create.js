define(function(require) {
    var Template = require('tpl!applications-create');
    var View = Backbone.Marionette.ItemView.extend({
        template: Template,
        id: 'application-create',
        attributes: {
            'class': 'modal'
        },
        show: function() {
            this.render();
            this.$el.modal('show');
        }
    });

    return View;
});