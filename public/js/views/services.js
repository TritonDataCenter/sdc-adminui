define(function(require) {

    var ApplicationCreateView = require('views/applications-create');
    var Template = require('tpl!services');
    var View = Backbone.Marionette.ItemView.extend({
        id: 'page-services',
        template: Template,
        name: 'services',

        events: {
            'click .create-application': 'showCreateApp'
        },

        url: function() {
            return '/services';
        },

        showCreateApp: function() {
            var view = new ApplicationCreateView();
            view.show();
        }
    });

    return View;
});