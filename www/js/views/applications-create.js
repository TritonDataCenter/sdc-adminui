var Backbone = require('backbone');


var Template = require('../tpl/applications-create.hbs');
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

module.exports = View;
