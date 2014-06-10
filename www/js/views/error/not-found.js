var Backbone = require('backbone');
var _ = require('underscore');

var NotFoundView = Backbone.Marionette.Layout.extend({
    template: require('./not-found.hbs'),
    serializeData: function() {
        this.options = this.options || {};
        var data = JSON.stringify(this.options, null, 2);
        return data;
    }
});

module.exports = NotFoundView;
