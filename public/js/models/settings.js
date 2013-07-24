var Backbone = require('backbone');

var Settings = Backbone.Model.extend({
    url: '/_/settings'
});


module.exports = new Settings();
