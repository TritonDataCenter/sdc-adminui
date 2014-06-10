var Backbone = require('backbone');

var Settings = Backbone.Model.extend({
    url: '/api/settings'
});


module.exports = new Settings();
