define(function(require) {
    var Template = require('tpl!services');
    var View = Backbone.Marionette.ItemView.extend({
        id: 'page-services',
        url: function() {
            return '/services';
        },
        template: Template
    });

    return View;
})