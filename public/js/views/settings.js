var Backbone = require('backbone')

var SettingsView = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/settings.hbs'),
    url: '/settings'
});


module.exports = SettingsView;
