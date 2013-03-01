define(function(require) {
    var Template = require('tpl!services-create');

    var View = Backbone.Marionette.ItemView.extend({
        template: Template
    });

    return View;
});