var Backbone = require('backbone');



var ApplicationCreateView = require('./applications-create');
var Template = require('../tpl/services.hbs');
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

module.exports = View;
